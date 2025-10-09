/**
 * SQLite Trip Service - Handles trip-related database operations
 * Part of Section 2: Trip Store Integration
 *
 * Uses Expo SQLite v16 API with proper getAllAsync/getFirstAsync/runAsync methods
 * and parameter binding for security against SQL injection.
 */

import { LocationSample, Trip, TripCreateInput } from "@/types/trip";
import { DatabaseService } from "./database.service";

export class TripDatabaseService {
  private static databaseService = DatabaseService.getInstance();

  /**
   * Create a new trip in SQLite database
   *
   * Note: Uses userId = "current-user" which references a default user record
   * created automatically during database initialization. This solves the
   * hybrid storage architecture where actual user data is in SecureStore
   * but trips need foreign key references in SQLite.
   */
  static async createTrip(tripData: TripCreateInput): Promise<Trip> {
    const db = await this.databaseService.getConnection();

    const newTrip: Trip = {
      id: Date.now().toString(),
      userId: "current-user", // TODO: Get from auth store
      title: tripData.title,
      origin: tripData.origin,
      destination: tripData.destination,
      status: "active",
      startAt: new Date().toISOString(),
      contacts: tripData.contacts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Insert trip into database using parameter binding
      const query = `
        INSERT INTO trips (
          id, user_id, name, description, start_location, end_location,
          actual_start_time, actual_end_time, status, emergency_contacts, safety_rules,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      console.log("🔍 Creating trip with contacts:", newTrip.contacts);
      console.log("🔍 Stringified contacts:", JSON.stringify(newTrip.contacts));

      await db.runAsync(
        query,
        newTrip.id,
        newTrip.userId,
        newTrip.title || "",
        "",
        JSON.stringify(newTrip.origin),
        JSON.stringify(newTrip.destination),
        newTrip.startAt,
        null,
        newTrip.status,
        JSON.stringify(newTrip.contacts),
        "{}",
        newTrip.createdAt,
        newTrip.updatedAt
      );

      console.log("✅ Trip created successfully:", newTrip.id);
      console.log("✅ Trip created with contacts:", newTrip.contacts);
      return newTrip;
    } catch (error) {
      console.error("❌ Error creating trip:", error);
      throw new Error("Failed to create trip");
    }
  }
  /**
   * Get all trips for the current user
   */ static async getAllTrips(): Promise<Trip[]> {
    const db = await this.databaseService.getConnection();

    try {
      const query = `
        SELECT * FROM trips 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;

      // Use getAllAsync directly on database for SELECT queries with parameter binding
      const rows = (await db.getAllAsync(query, "current-user")) as any[];
      const trips: Trip[] = [];

      for (const row of rows) {
        const trip: Trip = {
          id: row.id,
          userId: row.user_id,
          title: row.name || undefined,
          origin: JSON.parse(row.start_location),
          destination: JSON.parse(row.end_location),
          status: row.status as Trip["status"],
          startAt: row.actual_start_time, // Use correct column name from schema
          endAt: row.actual_end_time || undefined, // Use correct column name from schema
          contacts: JSON.parse(row.emergency_contacts || "[]"),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        trips.push(trip);
      }

      console.log(`✅ Loaded ${trips.length} trips from database`);
      return trips;
    } catch (error) {
      console.error("❌ Error fetching trips:", error);
      throw new Error("Failed to fetch trips");
    }
  }

  /**
   * Get trip by ID
   */ static async getTripById(id: string): Promise<Trip | null> {
    const db = await this.databaseService.getConnection();

    try {
      const query = `
        SELECT * FROM trips 
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `;

      // Use getFirstAsync for single row SELECT queries with parameter binding
      const row = (await db.getFirstAsync(query, id, "current-user")) as any;
      if (row) {
        const trip: Trip = {
          id: row.id,
          userId: row.user_id,
          title: row.name || undefined,
          origin: JSON.parse(row.start_location),
          destination: JSON.parse(row.end_location),
          status: row.status as Trip["status"],
          startAt: row.actual_start_time,
          endAt: row.actual_end_time || undefined,
          contacts: JSON.parse(row.emergency_contacts || "[]"),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        console.log("✅ Trip found:", trip.id);
        return trip;
      }

      console.log("⚠️ Trip not found:", id);
      return null;
    } catch (error) {
      console.error("❌ Error fetching trip by ID:", error);
      throw new Error("Failed to fetch trip");
    }
  }
  /**
   * Update trip status and other fields
   */ static async updateTrip(
    id: string,
    updates: Partial<Trip>
  ): Promise<Trip> {
    const db = await this.databaseService.getConnection();

    try {
      const updatedAt = new Date().toISOString();

      // Build update fields and parameters using proper parameter binding
      const updateFields: string[] = ["updated_at = ?"];
      const parameters: any[] = [updatedAt];

      if (updates.status) {
        updateFields.push("status = ?");
        parameters.push(updates.status);
      }
      if (updates.endAt) {
        updateFields.push("actual_end_time = ?");
        parameters.push(updates.endAt);
      }
      if (updates.title) {
        updateFields.push("name = ?");
        parameters.push(updates.title);
      }
      if (updates.contacts) {
        updateFields.push("emergency_contacts = ?");
        parameters.push(JSON.stringify(updates.contacts));
      }

      // Add WHERE clause parameters
      parameters.push(id);
      parameters.push("current-user");

      const query = `
        UPDATE trips 
        SET ${updateFields.join(", ")}
        WHERE id = ? AND user_id = ?
      `;

      console.log("🔄 Updating trip with query:", query);
      console.log("🔄 Parameters:", parameters);

      await db.runAsync(query, ...parameters);

      // Fetch and return updated trip
      const updatedTrip = await this.getTripById(id);
      if (!updatedTrip) {
        throw new Error("Trip not found after update");
      }

      console.log("✅ Trip updated successfully:", id);
      console.log("✅ Updated trip contacts:", updatedTrip.contacts);
      return updatedTrip;
    } catch (error) {
      console.error("❌ Error updating trip:", error);
      throw new Error("Failed to update trip");
    }
  }

  /**
   * Delete trip by ID
   */ static async deleteTrip(id: string): Promise<void> {
    const db = await this.databaseService.getConnection();

    try {
      // Delete associated location samples first
      const deleteLocationsQuery = `
        DELETE FROM location_samples 
        WHERE trip_id = '${id}'
      `;
      await db.execAsync(deleteLocationsQuery);

      // Delete the trip
      const deleteTripQuery = `
        DELETE FROM trips 
        WHERE id = '${id}' AND user_id = 'current-user'
      `;
      await db.execAsync(deleteTripQuery);

      console.log("✅ Trip deleted successfully:", id);
    } catch (error) {
      console.error("❌ Error deleting trip:", error);
      throw new Error("Failed to delete trip");
    }
  }
  /**
   * DEPRECATED: Local location sampling removed
   * Locations are now saved directly to Supabase instead of local SQLite
   */
  static async addLocationSample(location: LocationSample): Promise<void> {
    console.warn(
      "⚠️ addLocationSample is deprecated - locations are now saved to Supabase"
    );
    // Method kept for backward compatibility but does nothing
    return;
  }
  /**
   * DEPRECATED: Local location history removed
   * Location history is now fetched from Supabase instead of local SQLite
   */ static async getLocationHistory(
    tripId: string
  ): Promise<LocationSample[]> {
    console.warn(
      "⚠️ getLocationHistory is deprecated - locations are now in Supabase"
    );
    // Method kept for backward compatibility but returns empty array
    return [];
  }
  /**
   * DEPRECATED: Clear location history for a trip (no longer needed with Supabase)
   */
  static async clearLocationHistory(tripId: string): Promise<void> {
    console.warn(
      "⚠️ clearLocationHistory is deprecated - locations are now in Supabase"
    );
    // Method kept for backward compatibility but does nothing
    return;
  }

  /**
   * Get active trips (status = 'active')
   */ static async getActiveTrips(): Promise<Trip[]> {
    const db = await this.databaseService.getConnection();

    try {
      const query = `
        SELECT * FROM trips 
        WHERE user_id = ? AND status = ?
        ORDER BY created_at DESC
      `;

      // Use getAllAsync for multiple row SELECT queries with parameter binding
      const rows = (await db.getAllAsync(
        query,
        "current-user",
        "active"
      )) as any[];
      const trips: Trip[] = [];
      for (const row of rows) {
        const trip: Trip = {
          id: row.id,
          userId: row.user_id,
          title: row.name || undefined,
          origin: JSON.parse(row.start_location),
          destination: JSON.parse(row.end_location),
          status: row.status as Trip["status"],
          startAt: row.actual_start_time,
          endAt: row.actual_end_time || undefined,
          contacts: JSON.parse(row.emergency_contacts || "[]"),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        trips.push(trip);
      }

      console.log(`✅ Found ${trips.length} active trips`);
      return trips;
    } catch (error) {
      console.error("❌ Error fetching active trips:", error);
      throw new Error("Failed to fetch active trips");
    }
  }
}
