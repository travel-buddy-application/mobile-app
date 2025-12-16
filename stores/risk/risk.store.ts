import { RiskSettings, RuleState } from "@/types/trip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface RiskStoreState {
  ruleState: RuleState;
  settings: RiskSettings;
  isMonitoring: boolean;
  countdownTimer: number | null;

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
  checkInInterval: 30, 
  inactivityThreshold: 60, 
  deviationRadius: 500,
  maxMissedCheckIns: 2,
  countdownDuration: 60,
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
        ruleState: { ...defaultRuleState },
        settings: { ...defaultSettings },
        isMonitoring: false,
        countdownTimer: null,

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

          const { countdownTimer } = get();
          if (countdownTimer) {
            clearInterval(countdownTimer);
            set({ countdownTimer: null });
          }
        },

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

        setDeviationFlag: (flag: boolean) => {
          const { ruleState } = get();

          set({
            ruleState: {
              ...ruleState,
              deviationFlag: flag,
            },
          });

          if (flag && ruleState.escalationLevel === "none") {
            set({
              ruleState: {
                ...get().ruleState,
                escalationLevel: "warning",
              },
            });
          }
        },

        updateInactivity: (since?: number) => {
          const { ruleState, settings } = get();
          const now = Date.now();

          if (since && now - since > settings.inactivityThreshold * 60 * 1000) {
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
            set({
              ruleState: {
                ...ruleState,
                inactivitySince: undefined,
              },
            });
          }
        },

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
