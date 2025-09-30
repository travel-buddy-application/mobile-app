import { RiskSettings, RuleState } from "@/types/trip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface RiskStoreState {
  // State
  ruleState: RuleState;
  settings: RiskSettings;
  isMonitoring: boolean;
  countdownTimer: number | null;

  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordCheckIn: () => void;
  missedCheckIn: () => void;
  setDeviationFlag: (flag: boolean) => void;
  updateInactivity: (since?: number) => void;
  startCountdown: () => void;
  stopCountdown: () => void;
  escalateToSOS: () => void;
  resetRuleState: () => void;
  updateSettings: (settings: Partial<RiskSettings>) => void;
}

const defaultSettings: RiskSettings = {
  checkInInterval: 30, // 30 minutes
  inactivityThreshold: 60, // 60 minutes
  deviationRadius: 500, // 500 meters
  maxMissedCheckIns: 2,
  countdownDuration: 60, // 60 seconds
};

const defaultRuleState: RuleState = {
  lastOkPromptAt: 0,
  missedOkCount: 0,
  inactivitySince: undefined,
  deviationFlag: false,
  escalationLevel: "none",
  lastCheckIn: 0,
  nextCheckInDue: 0,
};

export const useRiskStore = create<RiskStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ruleState: { ...defaultRuleState },
        settings: { ...defaultSettings },
        isMonitoring: false,
        countdownTimer: null,

        // Start risk monitoring
        startMonitoring: () => {
          const now = Date.now();
          const { settings } = get();

          set({
            isMonitoring: true,
            ruleState: {
              ...get().ruleState,
              lastCheckIn: now,
              nextCheckInDue: now + settings.checkInInterval * 60 * 1000,
              escalationLevel: "none",
            },
          });
        },

        // Stop risk monitoring
        stopMonitoring: () => {
          const { countdownTimer } = get();
          if (countdownTimer) {
            clearInterval(countdownTimer);
          }

          set({
            isMonitoring: false,
            countdownTimer: null,
            ruleState: { ...defaultRuleState },
          });
        },

        // Record successful check-in
        recordCheckIn: () => {
          const now = Date.now();
          const { settings } = get();

          set({
            ruleState: {
              ...get().ruleState,
              lastCheckIn: now,
              nextCheckInDue: now + settings.checkInInterval * 60 * 1000,
              lastOkPromptAt: now,
              missedOkCount: 0,
              escalationLevel: "none",
              inactivitySince: undefined,
            },
          });

          // Stop countdown if running
          const { countdownTimer } = get();
          if (countdownTimer) {
            clearInterval(countdownTimer);
            set({ countdownTimer: null });
          }
        },

        // Handle missed check-in
        missedCheckIn: () => {
          const { ruleState, settings } = get();
          const newMissedCount = ruleState.missedOkCount + 1;

          let newEscalationLevel: RuleState["escalationLevel"] = "warning";

          if (newMissedCount >= settings.maxMissedCheckIns) {
            newEscalationLevel = "countdown";
            get().startCountdown();
          }

          set({
            ruleState: {
              ...ruleState,
              missedOkCount: newMissedCount,
              escalationLevel: newEscalationLevel,
              lastOkPromptAt: Date.now(),
            },
          });
        },

        // Set route deviation flag
        setDeviationFlag: (flag: boolean) => {
          const { ruleState } = get();

          set({
            ruleState: {
              ...ruleState,
              deviationFlag: flag,
            },
          });

          // If deviation detected, trigger warning
          if (flag && ruleState.escalationLevel === "none") {
            set({
              ruleState: {
                ...get().ruleState,
                escalationLevel: "warning",
              },
            });
          }
        },

        // Update inactivity status
        updateInactivity: (since?: number) => {
          const { ruleState, settings } = get();
          const now = Date.now();

          if (since && now - since > settings.inactivityThreshold * 60 * 1000) {
            // Inactivity threshold exceeded
            set({
              ruleState: {
                ...ruleState,
                inactivitySince: since,
                escalationLevel:
                  ruleState.escalationLevel === "none"
                    ? "warning"
                    : ruleState.escalationLevel,
              },
            });
          } else {
            // Clear inactivity
            set({
              ruleState: {
                ...ruleState,
                inactivitySince: undefined,
              },
            });
          }
        },

        // Start countdown to SOS
        startCountdown: () => {
          const { settings } = get();
          let timeLeft = settings.countdownDuration;

          set({
            ruleState: {
              ...get().ruleState,
              escalationLevel: "countdown",
            },
          });

          const timer = setInterval(() => {
            timeLeft -= 1;

            if (timeLeft <= 0) {
              clearInterval(timer);
              get().escalateToSOS();
            }
          }, 1000);

          set({ countdownTimer: timer });
        },

        // Stop countdown
        stopCountdown: () => {
          const { countdownTimer } = get();
          if (countdownTimer) {
            clearInterval(countdownTimer);
            set({
              countdownTimer: null,
              ruleState: {
                ...get().ruleState,
                escalationLevel: "warning",
              },
            });
          }
        },

        // Escalate to full SOS
        escalateToSOS: () => {
          const { countdownTimer } = get();
          if (countdownTimer) {
            clearInterval(countdownTimer);
          }

          set({
            countdownTimer: null,
            ruleState: {
              ...get().ruleState,
              escalationLevel: "sos",
            },
          });
        },

        // Reset rule state
        resetRuleState: () => {
          const { countdownTimer } = get();
          if (countdownTimer) {
            clearInterval(countdownTimer);
          }

          set({
            ruleState: { ...defaultRuleState },
            countdownTimer: null,
          });
        },

        // Update risk settings
        updateSettings: (newSettings: Partial<RiskSettings>) => {
          set({
            settings: {
              ...get().settings,
              ...newSettings,
            },
          });
        },
      }),
      {
        name: "risk-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          settings: state.settings,
          ruleState: state.ruleState,
        }),
      }
    ),
    { name: "risk-store" }
  )
);
