import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ReceivedTripSession {
  sessionId: string;
  userId: string;
  userName?: string;
  tripTitle?: string;
  receivedAt: string;
  lastLocationFetch?: string;
  isActive: boolean;
}

interface ReceivedTripsState {
  // State
  receivedSessions: ReceivedTripSession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addReceivedSession: (
    session: Omit<ReceivedTripSession, "receivedAt" | "isActive">
  ) => void;
  updateSessionLastFetch: (sessionId: string) => void;
  markSessionInactive: (sessionId: string) => void;
  removeSession: (sessionId: string) => void;
  clearExpiredSessions: () => void;
  clearError: () => void;
}

export const useReceivedTripsStore = create<ReceivedTripsState>()(
  persist(
    (set, get) => ({
      // Initial state
      receivedSessions: [],
      isLoading: false,
      error: null,

      // Add a new received session from notification
      addReceivedSession: (sessionData) => {
        const sessions = get().receivedSessions;

        // Check if session already exists
        const existingIndex = sessions.findIndex(
          (s) => s.sessionId === sessionData.sessionId
        );

        const newSession: ReceivedTripSession = {
          ...sessionData,
          receivedAt: new Date().toISOString(),
          isActive: true,
        };

        let updatedSessions: ReceivedTripSession[];

        if (existingIndex >= 0) {
          // Update existing session
          updatedSessions = [...sessions];
          updatedSessions[existingIndex] = newSession;
          console.log(
            "📱 Updated existing received session:",
            sessionData.sessionId
          );
        } else {
          updatedSessions = [newSession, ...sessions];
          console.log("📱 Added new received session:", sessionData.sessionId);
        }

        set({ receivedSessions: updatedSessions });
      },

      updateSessionLastFetch: (sessionId) => {
        const sessions = get().receivedSessions;
        const updatedSessions = sessions.map((session) =>
          session.sessionId === sessionId
            ? { ...session, lastLocationFetch: new Date().toISOString() }
            : session
        );

        set({ receivedSessions: updatedSessions });
        console.log("📍 Updated last fetch time for session:", sessionId);
      },

      markSessionInactive: (sessionId) => {
        const sessions = get().receivedSessions;
        const updatedSessions = sessions.map((session) =>
          session.sessionId === sessionId
            ? { ...session, isActive: false }
            : session
        );

        set({ receivedSessions: updatedSessions });
        console.log("🛑 Marked session as inactive:", sessionId);
      },

      removeSession: (sessionId) => {
        const sessions = get().receivedSessions;
        const updatedSessions = sessions.filter(
          (session) => session.sessionId !== sessionId
        );

        set({ receivedSessions: updatedSessions });
        console.log("🗑️ Removed session:", sessionId);
      },

      clearExpiredSessions: () => {
        const now = new Date();
        const twentyFourHoursAgo = new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        );

        const sessions = get().receivedSessions;
        const activeSessions = sessions.filter((session) => {
          const receivedAt = new Date(session.receivedAt);
          const isRecent = receivedAt > twentyFourHoursAgo;
          const shouldKeep = session.isActive || isRecent;

          if (!shouldKeep) {
            console.log("🧹 Removing expired session:", session.sessionId);
          }

          return shouldKeep;
        });

        const removedCount = sessions.length - activeSessions.length;
        if (removedCount > 0) {
          set({ receivedSessions: activeSessions });
          console.log(`🧹 Cleared ${removedCount} expired sessions`);
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "received-trips-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        receivedSessions: state.receivedSessions,
      }),
    }
  )
);

export const useReceivedTripsSelectors = () => {
  const store = useReceivedTripsStore();

  return {
    ...store,
    activeSessions: store.receivedSessions.filter((s) => s.isActive),
    inactiveSessions: store.receivedSessions.filter((s) => !s.isActive),
    recentSessions: store.receivedSessions.filter((s) => {
      const receivedAt = new Date(s.receivedAt);
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      return receivedAt > sixHoursAgo;
    }),
  };
};
