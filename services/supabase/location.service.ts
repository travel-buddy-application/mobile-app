// Supabase Location Service for Travel Buddy
// Handles location data storage and retrieval from Supabase database

import { useAuthStore } from "@/stores/auth/auth.store";
import { LocationSample } from "@/types/trip";
import { Database, supabaseClient } from "./client";

// Type definitions for location data
type LocationRow = Database["public"]["Tables"]["location"]["Row"];
type LocationInsert = Database["public"]["Tables"]["location"]["Insert"];

export interface LocationSession {
  sessionId: string;
  userId: string;
  startedAt: string;
  isActive: boolean;
}

export interface SupabaseLocationSample extends LocationSample {
  supabaseId?: number;
  sessionId: string;
  userId: string;
}

export class SupabaseLocationService {
  private static instance: SupabaseLocationService;

  static getInstance(): SupabaseLocationService {
    if (!SupabaseLocationService.instance) {
      SupabaseLocationService.instance = new SupabaseLocationService();
    }
    return SupabaseLocationService.instance;
  }

  /**
   * Save a location sample to Supabase
   * Replaces local SQLite storage
   */
  async saveLocation(
    location: LocationSample,
    sessionId: string,
    userId?: string
  ): Promise<SupabaseLocationSample | null> {
    try {
      // Get user ID from auth store if not provided
      const effectiveUserId =
        userId || useAuthStore.getState().user?.id || "anonymous-user";

      // console.log("📍 Saving location to Supabase:", {
      //   locationId: location.id,
      //   sessionId,
      //   userId: effectiveUserId,
      //   coordinates: `${location.lat}, ${location.lng}`,
      //   accuracy: location.accuracy,
      // });

      const locationData: LocationInsert = {
        user_id: effectiveUserId,
        session_id: sessionId,
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      };

      const { data, error } = await supabaseClient
        .from("location")
        .insert(locationData)
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to save location to Supabase:", error);
        return null;
      }

      console.log("✅ Location saved to Supabase:", data.id);

      // Return enhanced location sample
      const supabaseLocation: SupabaseLocationSample = {
        ...location,
        supabaseId: data.id,
        sessionId,
        userId: effectiveUserId,
      };

      return supabaseLocation;
    } catch (error) {
      console.error("❌ Error saving location to Supabase:", error);
      return null;
    }
  }

  /**
   * Save multiple location samples in batch
   * More efficient for bulk operations
   */
  async saveLocationsBatch(
    locations: LocationSample[],
    sessionId: string,
    userId?: string
  ): Promise<SupabaseLocationSample[]> {
    try {
      const effectiveUserId =
        userId || useAuthStore.getState().user?.id || "anonymous-user";

      console.log(
        `📍 Saving ${locations.length} locations to Supabase in batch:`,
        {
          sessionId,
          userId: effectiveUserId,
        }
      );

      const locationData: LocationInsert[] = locations.map((location) => ({
        user_id: effectiveUserId,
        session_id: sessionId,
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      }));

      const { data, error } = await supabaseClient
        .from("location")
        .insert(locationData)
        .select();

      if (error) {
        console.error("❌ Failed to save locations batch to Supabase:", error);
        return [];
      }

      console.log(`✅ ${data.length} locations saved to Supabase`);

      // Return enhanced location samples
      const supabaseLocations: SupabaseLocationSample[] = locations.map(
        (location, index) => ({
          ...location,
          supabaseId: data[index]?.id,
          sessionId,
          userId: effectiveUserId,
        })
      );

      return supabaseLocations;
    } catch (error) {
      console.error("❌ Error saving locations batch to Supabase:", error);
      return [];
    }
  }

  /**
   * Get location history for a specific session
   * Used by receivers to fetch sender's locations
   */
  async getLocationsBySession(
    sessionId: string,
    limit?: number
  ): Promise<SupabaseLocationSample[]> {
    try {
      console.log("📍 Fetching locations from Supabase:", {
        sessionId,
        limit: limit || "all",
      });

      let query = supabaseClient
        .from("location")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Failed to fetch locations from Supabase:", error);
        return [];
      }

      console.log(
        `✅ Fetched ${data.length} locations for session: ${sessionId}`
      );

      // Convert Supabase rows to LocationSample format
      const locations: SupabaseLocationSample[] = data.map(
        (row: LocationRow) => ({
          id: `supabase_${row.id}`,
          supabaseId: row.id,
          tripId: "", // Not used in new architecture
          sessionId: row.session_id || "",
          userId: row.user_id || "",
          timestamp: new Date(row.created_at).getTime(),
          lat: parseFloat(row.lat || "0"),
          lng: parseFloat(row.lng || "0"),
          accuracy: 10, // Default accuracy since not stored
          source: "gps" as const,
          createdAt: row.created_at,
        })
      );

      return locations;
    } catch (error) {
      console.error("❌ Error fetching locations from Supabase:", error);
      return [];
    }
  }

  /**
   * Get the most recent location for a session
   * Used for quick location checks
   */
  async getLatestLocation(
    sessionId: string
  ): Promise<SupabaseLocationSample | null> {
    try {
      const locations = await this.getLocationsBySession(sessionId, 1);
      return locations.length > 0 ? locations[0] : null;
    } catch (error) {
      console.error("❌ Error fetching latest location:", error);
      return null;
    }
  }

  /**
   * Get all locations for a user across all sessions
   * Used for user location history
   */
  async getLocationsByUser(
    userId: string,
    limit?: number
  ): Promise<SupabaseLocationSample[]> {
    try {
      console.log("📍 Fetching user locations from Supabase:", {
        userId,
        limit: limit || "all",
      });

      let query = supabaseClient
        .from("location")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "❌ Failed to fetch user locations from Supabase:",
          error
        );
        return [];
      }

      console.log(`✅ Fetched ${data.length} locations for user: ${userId}`);

      // Convert to LocationSample format
      const locations: SupabaseLocationSample[] = data.map(
        (row: LocationRow) => ({
          id: `supabase_${row.id}`,
          supabaseId: row.id,
          tripId: "",
          sessionId: row.session_id || "",
          userId: row.user_id || "",
          timestamp: new Date(row.created_at).getTime(),
          lat: parseFloat(row.lat || "0"),
          lng: parseFloat(row.lng || "0"),
          accuracy: 10,
          source: "gps" as const,
          createdAt: row.created_at,
        })
      );

      return locations;
    } catch (error) {
      console.error("❌ Error fetching user locations from Supabase:", error);
      return [];
    }
  }

  /**
   * Delete locations for a specific session
   * Used for privacy/cleanup
   */
  async deleteLocationSession(sessionId: string): Promise<boolean> {
    try {
      console.log("🗑️ Deleting location session from Supabase:", sessionId);

      const { error } = await supabaseClient
        .from("location")
        .delete()
        .eq("session_id", sessionId);

      if (error) {
        console.error("❌ Failed to delete location session:", error);
        return false;
      }

      console.log("✅ Location session deleted:", sessionId);
      return true;
    } catch (error) {
      console.error("❌ Error deleting location session:", error);
      return false;
    }
  }

  /**
   * Delete old locations (cleanup task)
   * Remove locations older than specified days
   */
  async deleteOldLocations(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(
        "🧹 Cleaning up old locations older than:",
        cutoffDate.toISOString()
      );

      const { error, count } = await supabaseClient
        .from("location")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) {
        console.error("❌ Failed to delete old locations:", error);
        return 0;
      }

      console.log(`✅ Deleted ${count || 0} old location records`);
      return count || 0;
    } catch (error) {
      console.error("❌ Error deleting old locations:", error);
      return 0;
    }
  }

  /**
   * Generate a unique session ID for location tracking
   */
  static generateSessionId(userId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const userPrefix = userId ? userId.substring(0, 4) : "anon";
    return `${userPrefix}_${timestamp}_${random}`;
  }

  /**
   * Check if a session has recent activity
   */
  async isSessionActive(
    sessionId: string,
    timeoutMinutes: number = 30
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

      const { data, error } = await supabaseClient
        .from("location")
        .select("created_at")
        .eq("session_id", sessionId)
        .gt("created_at", cutoffTime.toISOString())
        .limit(1);

      if (error) {
        console.error("❌ Failed to check session activity:", error);
        return false;
      }

      const isActive = data.length > 0;
      console.log(
        `📍 Session ${sessionId} is ${isActive ? "active" : "inactive"}`
      );

      return isActive;
    } catch (error) {
      console.error("❌ Error checking session activity:", error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseLocationService = SupabaseLocationService.getInstance();
