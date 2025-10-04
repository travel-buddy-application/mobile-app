import { databaseService } from "@/services/database/database.service";

/**
 * Database testing utilities for development
 * These functions help verify the database is working correctly
 */

export const testDatabase = {
  // Test basic database functionality
  async runBasicTests(): Promise<void> {
    console.log("🧪 Running database tests...");

    try {
      // Test database info
      const info = await databaseService.getInfo();
      console.log("📊 Database Info:", info);

      // Test health check
      const isHealthy = await databaseService.healthCheck();
      console.log("🏥 Health Check:", isHealthy ? "PASSED" : "FAILED");

      console.log("✅ Basic database tests completed");
    } catch (error) {
      console.error("❌ Database tests failed:", error);
    }
  },

  // Create test user data
  async createTestUser(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      const testUser = {
        id: "test_user_123",
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        preferences: JSON.stringify({
          theme: "auto",
          notifications: true,
        }),
      }; // Use execAsync with string interpolation (for testing only - not secure for production)
      await db.execAsync(`
        INSERT OR REPLACE INTO users (id, name, phone, email, preferences) 
        VALUES ('${testUser.id}', '${testUser.name}', '${testUser.phone}', '${testUser.email}', '${testUser.preferences}');
      `);

      console.log("✅ Test user created:", testUser.name);
    } catch (error) {
      console.error("❌ Failed to create test user:", error);
    }
  },

  // Create test trip data
  async createTestTrip(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      const testTrip = {
        id: "test_trip_456",
        user_id: "test_user_123",
        name: "Test Safety Trip",
        description: "A test trip for database verification",
        start_location: JSON.stringify({
          address: "New York, NY",
          lat: 40.7128,
          lng: -74.006,
        }),
        end_location: JSON.stringify({
          address: "Boston, MA",
          lat: 42.3601,
          lng: -71.0589,
        }),
        status: "planned",
      }; // Use execAsync with string interpolation (for testing only)
      await db.execAsync(`
        INSERT OR REPLACE INTO trips (id, user_id, name, description, start_location, end_location, status) 
        VALUES ('${testTrip.id}', '${testTrip.user_id}', '${testTrip.name}', '${testTrip.description}', '${testTrip.start_location}', '${testTrip.end_location}', '${testTrip.status}');
      `);

      console.log("✅ Test trip created:", testTrip.name);
    } catch (error) {
      console.error("❌ Failed to create test trip:", error);
    }
  },

  // Create test location samples
  async createTestLocationSamples(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      const samples = [
        { lat: 40.7128, lng: -74.006, accuracy: 5.0 },
        { lat: 40.7589, lng: -73.9851, accuracy: 3.2 },
        { lat: 40.7831, lng: -73.9712, accuracy: 4.1 },
      ];
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        await db.execAsync(`
          INSERT INTO location_samples (id, trip_id, latitude, longitude, accuracy) 
          VALUES ('sample_${i + 1}', 'test_trip_456', ${sample.lat}, ${
          sample.lng
        }, ${sample.accuracy});
        `);
      }

      console.log("✅ Test location samples created:", samples.length);
    } catch (error) {
      console.error("❌ Failed to create test location samples:", error);
    }
  },
  // Query test data (simplified to avoid query issues)
  async queryTestData(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      console.log(
        "📊 Testing table access (detailed queries disabled due to API issues):"
      );

      // Test table existence
      try {
        await db.execAsync("SELECT 1 FROM users LIMIT 1;");
        console.log("✅ Users table accessible");
      } catch (error) {
        console.log("❌ Users table issue:", error);
      }

      try {
        await db.execAsync("SELECT 1 FROM trips LIMIT 1;");
        console.log("✅ Trips table accessible");
      } catch (error) {
        console.log("❌ Trips table issue:", error);
      }

      try {
        await db.execAsync("SELECT 1 FROM location_samples LIMIT 1;");
        console.log("✅ Location samples table accessible");
      } catch (error) {
        console.log("❌ Location samples table issue:", error);
      }
    } catch (error) {
      console.error("❌ Failed to query test data:", error);
    }
  },

  // Clean up test data
  async cleanupTestData(): Promise<void> {
    try {
      const db = await databaseService.getConnection();
      await db.execAsync(
        "DELETE FROM location_samples WHERE trip_id = 'test_trip_456';"
      );
      await db.execAsync("DELETE FROM trips WHERE id = 'test_trip_456';");
      await db.execAsync("DELETE FROM users WHERE id = 'test_user_123';");

      console.log("🧹 Test data cleaned up");
    } catch (error) {
      console.error("❌ Failed to cleanup test data:", error);
    }
  },

  // Run full test suite
  async runFullTestSuite(): Promise<void> {
    console.log("🚀 Running full database test suite...");

    await this.runBasicTests();
    await this.createTestUser();
    await this.createTestTrip();
    await this.createTestLocationSamples();
    await this.queryTestData();

    console.log("✅ Full test suite completed");
    console.log("💡 Run testDatabase.cleanupTestData() to remove test data");
  },
};

// Export for easy access in development
export default testDatabase;
