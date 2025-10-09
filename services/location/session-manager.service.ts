// Location Session Manager for Travel Buddy
// Manages session IDs for location tracking across trips

import { useAuthStore } from "@/stores/auth/auth.store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseLocationService } from "../supabase/location.service";

export interface LocationSession {
  sessionId: string;
  userId: string;
  tripId: string;
  tripTitle?: string;
  startedAt: string;
  isActive: boolean;
}

export class LocationSessionManager {
  private static instance: LocationSessionManager;
  private currentSession: LocationSession | null = null;
  private readonly STORAGE_KEY = "travel-buddy-current-session";

  static getInstance(): LocationSessionManager {
    if (!LocationSessionManager.instance) {
      LocationSessionManager.instance = new LocationSessionManager();
    }
    return LocationSessionManager.instance;
  }

  /**
   * Start a new location tracking session for a trip
   */
  async startSession(
    tripId: string,
    tripTitle?: string
  ): Promise<LocationSession> {
    try {
      // Get user ID from auth store
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id || "anonymous-user";

      // Generate unique session ID
      const sessionId = SupabaseLocationService.generateSessionId(userId);

      const session: LocationSession = {
        sessionId,
        userId,
        tripId,
        tripTitle,
        startedAt: new Date().toISOString(),
        isActive: true,
      };

      // Store current session
      this.currentSession = session;
      await this.saveSessionToStorage(session);

      console.log("🚀 Location session started:", {
        sessionId,
        tripId,
        tripTitle,
        userId,
      });

      return session;
    } catch (error) {
      console.error("❌ Failed to start location session:", error);
      throw error;
    }
  }

  /**
   * Get the current active session
   */
  getCurrentSession(): LocationSession | null {
    return this.currentSession;
  }

  /**
   * Stop the current session
   */
  async stopSession(): Promise<void> {
    try {
      if (this.currentSession) {
        const sessionId = this.currentSession.sessionId;

        // Mark session as inactive
        this.currentSession.isActive = false;
        await this.saveSessionToStorage(this.currentSession);

        console.log("🛑 Location session stopped:", sessionId);

        // Clear current session
        this.currentSession = null;
        await this.clearSessionFromStorage();
      }
    } catch (error) {
      console.error("❌ Failed to stop location session:", error);
    }
  }

  /**
   * Check if there's an active session
   */
  hasActiveSession(): boolean {
    return this.currentSession?.isActive === true;
  }

  /**
   * Get session ID for current tracking
   */
  getSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  /**
   * Get user ID for current session
   */
  getUserId(): string | null {
    return this.currentSession?.userId || null;
  }

  /**
   * Restore session from storage on app restart
   */
  async restoreSession(): Promise<LocationSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.STORAGE_KEY);

      if (sessionData) {
        const session: LocationSession = JSON.parse(sessionData);

        // Check if session is still active and not too old (24 hours max)
        const sessionAge = Date.now() - new Date(session.startedAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (session.isActive && sessionAge < maxAge) {
          this.currentSession = session;
          console.log("♻️ Location session restored:", session.sessionId);
          return session;
        } else {
          // Session expired, clear it
          await this.clearSessionFromStorage();
          console.log("⏰ Location session expired and cleared");
        }
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to restore location session:", error);
      return null;
    }
  }

  /**
   * Force create a session if none exists (for backward compatibility)
   */
  async ensureSession(
    tripId: string,
    tripTitle?: string
  ): Promise<LocationSession> {
    if (this.currentSession?.isActive) {
      return this.currentSession;
    }

    return await this.startSession(tripId, tripTitle);
  }

  /**
   * Get session info for notifications
   */
  getSessionNotificationData(): { sessionId: string; userId: string } | null {
    if (!this.currentSession) {
      return null;
    }

    return {
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
    };
  }

  /**
   * Check if session is active in Supabase (has recent locations)
   */
  async checkSessionActivity(timeoutMinutes: number = 30): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    try {
      const { supabaseLocationService } = await import(
        "../supabase/location.service"
      );
      return await supabaseLocationService.isSessionActive(
        this.currentSession.sessionId,
        timeoutMinutes
      );
    } catch (error) {
      console.error("❌ Failed to check session activity:", error);
      return false;
    }
  }

  /**
   * Save session to AsyncStorage
   */
  private async saveSessionToStorage(session: LocationSession): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("❌ Failed to save session to storage:", error);
    }
  }

  /**
   * Clear session from AsyncStorage
   */
  private async clearSessionFromStorage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("❌ Failed to clear session from storage:", error);
    }
  }

  /**
   * Generate session summary for sharing
   */
  async getSessionSummary(): Promise<string> {
    if (!this.currentSession) {
      return "No active location session";
    }

    try {
      const { supabaseLocationService } = await import(
        "../supabase/location.service"
      );
      const locations = await supabaseLocationService.getLocationsBySession(
        this.currentSession.sessionId,
        50 // Last 50 locations
      );

      let summary = `📍 Location Session Summary\n\n`;
      summary += `Session ID: ${this.currentSession.sessionId}\n`;
      summary += `Trip: ${this.currentSession.tripTitle || "Safety Trip"}\n`;
      summary += `Started: ${new Date(
        this.currentSession.startedAt
      ).toLocaleString()}\n`;
      summary += `Status: ${
        this.currentSession.isActive ? "Active" : "Inactive"
      }\n`;
      summary += `Locations recorded: ${locations.length}\n\n`;

      if (locations.length > 0) {
        const latest = locations[0];
        const duration =
          Date.now() - new Date(this.currentSession.startedAt).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        summary += `Duration: ${hours}h ${minutes}m\n`;
        summary += `Last location: ${new Date(
          latest.createdAt
        ).toLocaleString()}\n`;
        summary += `Coordinates: ${latest.lat}, ${latest.lng}\n`;
      }

      return summary;
    } catch (error) {
      console.error("❌ Failed to generate session summary:", error);
      return "Failed to generate session summary";
    }
  }
}

// Export singleton instance
export const locationSessionManager = LocationSessionManager.getInstance();
