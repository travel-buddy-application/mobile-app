// Location Database Fix Utility
// Fixes schema mismatches and tests location sample insertion

import { DatabaseService } from "@/services/database/database.service";
import { TripDatabaseService } from "@/services/database/trip.service";
import { LocationSample } from "@/types/trip";

class LocationDatabaseFix {
  /**
   * Test location sample insertion with correct schema
   */
  static async testLocationSampleInsertion(): Promise<boolean> {
    try {
      console.log("🧪 Testing location sample insertion...");

      // Create a test location sample
      const testLocation: LocationSample = {
        id: `test_location_${Date.now()}`,
        tripId: "test_trip_123",
        timestamp: Date.now(),
        lat: 5.9469,
        lng: 80.5349,
        accuracy: 10.5,
        speed: 0,
        source: "gps",
        createdAt: new Date().toISOString(),
      };

      // Try to add the location sample
      await TripDatabaseService.addLocationSample(testLocation);

      console.log("✅ Location sample insertion successful!");

      // Try to retrieve the location
      const locations = await TripDatabaseService.getLocationHistory(
        "test_trip_123"
      );
      console.log(`📍 Retrieved ${locations.length} location samples`);

      if (locations.length > 0) {
        const retrieved = locations[locations.length - 1];
        console.log("📍 Sample location data:", {
          id: retrieved.id,
          lat: retrieved.lat,
          lng: retrieved.lng,
          accuracy: retrieved.accuracy,
        });
      }

      return true;
    } catch (error) {
      console.error("❌ Location sample insertion test failed:", error);
      return false;
    }
  }

  /**
   * Check location_samples table schema
   */
  static async checkLocationSamplesSchema(): Promise<void> {
    try {
      console.log("🔍 Checking location_samples table schema...");

      const databaseService = DatabaseService.getInstance();
      const db = await databaseService.getConnection();

      // Get table schema information
      const schema = await db.getAllAsync(
        "PRAGMA table_info(location_samples)"
      );

      console.log("📋 location_samples table columns:");
      schema.forEach((column: any) => {
        console.log(
          `  - ${column.name}: ${column.type} ${
            column.notnull ? "NOT NULL" : ""
          } ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ""}`
        );
      });

      // Check if required columns exist
      const columnNames = schema.map((col: any) => col.name);
      const requiredColumns = [
        "id",
        "trip_id",
        "latitude",
        "longitude",
        "accuracy",
        "timestamp",
      ];

      console.log("\n🔍 Required columns check:");
      requiredColumns.forEach((col) => {
        const exists = columnNames.includes(col);
        console.log(`  - ${col}: ${exists ? "✅" : "❌"}`);
      });
    } catch (error) {
      console.error("❌ Schema check failed:", error);
    }
  }

  /**
   * Clean up test location samples
   */
  static async cleanupTestData(): Promise<void> {
    try {
      console.log("🧹 Cleaning up test location data...");

      const databaseService = DatabaseService.getInstance();
      const db = await databaseService.getConnection();

      // Clean up test location samples
      await db.runAsync(
        "DELETE FROM location_samples WHERE id LIKE 'test_location_%'"
      );
      await db.runAsync(
        "DELETE FROM location_samples WHERE trip_id = 'test_trip_123'"
      );

      console.log("✅ Test location data cleaned up");
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
    }
  }

  /**
   * Run all location database tests
   */
  static async runAllTests(): Promise<void> {
    console.log("🧪 Starting Location Database Fix Tests...\n");

    // Check schema
    await this.checkLocationSamplesSchema();

    console.log("\n");

    // Test insertion
    const insertionSuccess = await this.testLocationSampleInsertion();

    console.log("\n");

    // Clean up
    await this.cleanupTestData();

    console.log("\n🎯 Location Database Fix Tests Complete!");
    console.log(
      `📊 Insertion Test: ${insertionSuccess ? "✅ PASSED" : "❌ FAILED"}`
    );
  }
}

export default LocationDatabaseFix;
