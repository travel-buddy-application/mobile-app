/**
 * SQLite Trip Service - Handles trip-related database operations
 * Part of Section 2: Trip Store Integration
 * 
 * Note: This is a simplified version that only supports write operations
 * due to Expo SQLite v14 limitations with execAsync.
 * Read operations will be implemented once we resolve the query result handling.
 */

import { Trip, TripCreateInput, LocationSample } from '@/types/trip';
import { DatabaseService } from './database.service';

export class TripDatabaseService {
  private static databaseService = DatabaseService.getInstance();

  /**
   * Create a new trip in SQLite database
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
      // Map our Trip fields to the actual database column names
      const query = `
        INSERT INTO trips (
          id, user_id, name, description, start_location, end_location,
          actual_start_time, actual_end_time, status, emergency_contacts, safety_rules,
          created_at, updated_at
        ) VALUES (
          '${newTrip.id}',
          '${newTrip.userId}',
          '${newTrip.title || ""}',
          '',
          '${JSON.stringify(newTrip.origin)}',
          '${JSON.stringify(newTrip.destination)}',
          '${newTrip.startAt}',
          null,
          '${newTrip.status}',
          '${JSON.stringify(newTrip.contacts)}',
          '{}',
          '${newTrip.createdAt}',
          '${newTrip.updatedAt}'
        )
      `;

      await db.execAsync(query);
      
      console.log('✅ Trip created successfully:', newTrip.id);
      return newTrip;
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      throw new Error('Failed to create trip');
    }
  }

  /**
   * Get all trips - Simplified implementation for now
   * Returns empty array until we implement proper query handling
   */
  static async getAllTrips(): Promise<Trip[]> {
    console.log('⚠️ getAllTrips not yet implemented - returning empty array');
    return [];
  }

  /**
   * Get trip by ID - Simplified implementation for now
   */
  static async getTripById(id: string): Promise<Trip | null> {
    console.log('⚠️ getTripById not yet implemented - returning null');
    return null;
  }

  /**
   * Update trip - Only status updates for now
   */
  static async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const db = await this.databaseService.getConnection();
    
    try {
      const updatedAt = new Date().toISOString();
      
      // Build update fields dynamically
      const updateFields: string[] = [`updated_at = '${updatedAt}'`];
      
      if (updates.status) {
        updateFields.push(`status = '${updates.status}'`);
      }
      
      if (updates.endAt) {
        updateFields.push(`actual_end_time = '${updates.endAt}'`);
      }
      
      if (updates.title) {
        updateFields.push(`name = '${updates.title}'`);
      }
      
      if (updates.contacts) {
        updateFields.push(`emergency_contacts = '${JSON.stringify(updates.contacts)}'`);
      }

      const query = `
        UPDATE trips 
        SET ${updateFields.join(', ')}
        WHERE id = '${id}' AND user_id = 'current-user'
      `;

      await db.execAsync(query);
      
      console.log('✅ Trip updated successfully:', id);
      
      // Return a dummy trip object for now
      return {
        id: id,
        userId: 'current-user',
        title: updates.title,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 0, lng: 0 },
        status: updates.status || 'active',
        startAt: new Date().toISOString(),
        contacts: updates.contacts || [],
        createdAt: new Date().toISOString(),
        updatedAt: updatedAt,
        ...(updates.endAt && { endAt: updates.endAt })
      };
    } catch (error) {
      console.error('❌ Error updating trip:', error);
      throw new Error('Failed to update trip');
    }
  }

  /**
   * Delete trip by ID
   */
  static async deleteTrip(id: string): Promise<void> {
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
      
      console.log('✅ Trip deleted successfully:', id);
    } catch (error) {
      console.error('❌ Error deleting trip:', error);
      throw new Error('Failed to delete trip');
    }
  }

  /**
   * Add location sample to a trip
   */
  static async addLocationSample(location: LocationSample): Promise<void> {
    const db = await this.databaseService.getConnection();
    
    try {
      // Map to the actual database column names
      const query = `
        INSERT INTO location_samples (
          id, trip_id, latitude, longitude, accuracy, speed, timestamp
        ) VALUES (
          '${location.id}',
          '${location.tripId}',
          ${location.lat},
          ${location.lng},
          ${location.accuracy},
          ${location.speed || 'null'},
          '${new Date(location.timestamp).toISOString()}'
        )
      `;

      await db.execAsync(query);
      
      console.log('✅ Location sample added:', location.id);
    } catch (error) {
      console.error('❌ Error adding location sample:', error);
      throw new Error('Failed to add location sample');
    }
  }

  /**
   * Get location history for a trip - Simplified for now
   */
  static async getLocationHistory(tripId: string): Promise<LocationSample[]> {
    console.log('⚠️ getLocationHistory not yet implemented - returning empty array');
    return [];
  }

  /**
   * Clear location history for a trip
   */
  static async clearLocationHistory(tripId: string): Promise<void> {
    const db = await this.databaseService.getConnection();
    
    try {
      const query = `
        DELETE FROM location_samples 
        WHERE trip_id = '${tripId}'
      `;

      await db.execAsync(query);
      
      console.log('✅ Location history cleared for trip:', tripId);
    } catch (error) {
      console.error('❌ Error clearing location history:', error);
      throw new Error('Failed to clear location history');
    }
  }

  /**
   * Get active trips - Simplified for now
   */
  static async getActiveTrips(): Promise<Trip[]> {
    console.log('⚠️ getActiveTrips not yet implemented - returning empty array');
    return [];
  }

  /**
   * Test insert operation - For development testing
   */
  static async testInsert(): Promise<void> {
    console.log('🧪 Testing trip database insert...');
    
    const testTrip = await this.createTrip({
      title: "Test Trip",
      origin: { lat: 40.7128, lng: -74.0060, address: "NYC" },
      destination: { lat: 34.0522, lng: -118.2437, address: "LA" },
      contacts: []
    });
    
    console.log('✅ Test trip created:', testTrip.id);
  }
}
