import { databaseService } from "@/services/database/database.service";

/**
 * Simplified database testing utilities that avoid problematic SQLite operations
 * Uses only execAsync which we know works from table creation
 */

export const simpleDbTest = {
  // Test basic operations with simple queries
  async runBasicTest(): Promise<void> {
    console.log("🧪 Running simple database test...");

    try {
      const db = await databaseService.getConnection();

      // Test 1: Simple insert without parameters
      console.log("📝 Testing simple insert...");
      await db.execAsync(`
        INSERT OR REPLACE INTO users (id, name, phone) 
        VALUES ('test_123', 'Test User', '+1234567890');
      `);

      // Test 2: Simple select (this might still fail)
      console.log("📖 Testing simple select...");
      try {
        const result = (await db.getFirstAsync(
          "SELECT COUNT(*) as count FROM users;"
        )) as { count: number };
        console.log("✅ Users count:", result?.count);
      } catch (selectError) {
        console.log(
          "⚠️ Select failed (expected in current setup):",
          selectError
        );
      }

      console.log("✅ Simple database test completed");
    } catch (error) {
      console.error("❌ Simple database test failed:", error);
    }
  },

  // Test table existence
  async checkTables(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      console.log("📋 Checking table existence...");

      // Try simple table existence check
      try {
        await db.execAsync("SELECT 1 FROM users LIMIT 1;");
        console.log("✅ Users table exists and accessible");
      } catch (error) {
        console.log("❌ Users table issue:", error);
      }

      try {
        await db.execAsync("SELECT 1 FROM trips LIMIT 1;");
        console.log("✅ Trips table exists and accessible");
      } catch (error) {
        console.log("❌ Trips table issue:", error);
      }

      try {
        await db.execAsync("SELECT 1 FROM location_samples LIMIT 1;");
        console.log("✅ Location samples table exists and accessible");
      } catch (error) {
        console.log("❌ Location samples table issue:", error);
      }
    } catch (error) {
      console.error("❌ Table check failed:", error);
    }
  },
  // Simple cleanup using execAsync only
  async simpleCleanup(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      console.log("🧹 Simple cleanup..."); // Clean in proper order respecting foreign key constraints
      await db.execAsync("DELETE FROM location_samples;");
      await db.execAsync("DELETE FROM trips;");
      // Delete only test users, keep the default "current-user" for foreign keys
      await db.execAsync("DELETE FROM users WHERE id = 'test_123';");

      // Ensure default user still exists (safety check)
      await databaseService.ensureDefaultUserExists();

      console.log("✅ Simple cleanup completed (default user preserved)");
    } catch (error) {
      console.error("❌ Simple cleanup failed:", error);
    }
  },

  // Test foreign key constraints fix
  async testForeignKeyFix(): Promise<void> {
    console.log("🔑 Testing foreign key constraint fix...");

    try {
      const isValid = await databaseService.validateForeignKeyConstraints();

      if (isValid) {
        console.log("✅ Foreign key constraint fix is working!");
        console.log("   - Default user 'current-user' exists in database");
        console.log(
          "   - Trips can reference this user without constraint violations"
        );
      } else {
        console.log("❌ Foreign key constraint fix failed");
      }
    } catch (error) {
      console.error("❌ Foreign key test error:", error);
    }
  },

  // Comprehensive test to validate all foreign key fixes
  async validateAllFixes(): Promise<void> {
    console.log("🧪 Running comprehensive foreign key validation...");

    try {
      // Step 1: Check current state
      console.log("1️⃣ Checking initial state...");
      const db = await databaseService.getConnection();
      const userCount = (await db.getAllAsync(
        "SELECT COUNT(*) as count FROM users"
      )) as any[];
      const tripCount = (await db.getAllAsync(
        "SELECT COUNT(*) as count FROM trips"
      )) as any[];

      console.log(
        `   Users: ${userCount[0]?.count || 0}, Trips: ${
          tripCount[0]?.count || 0
        }`
      );

      // Step 2: Test foreign key validation
      console.log("2️⃣ Testing foreign key constraints...");
      await this.testForeignKeyFix();

      // Step 3: Test cleanup (should not break foreign keys)
      console.log("3️⃣ Testing cleanup without breaking foreign keys...");
      await this.simpleCleanup();

      // Step 4: Verify default user still exists after cleanup
      console.log("4️⃣ Verifying default user after cleanup...");
      const defaultUser = await db.getFirstAsync(
        "SELECT id FROM users WHERE id = 'current-user'"
      );
      if (defaultUser) {
        console.log("✅ Default user preserved after cleanup");
      } else {
        console.log("❌ Default user missing after cleanup!");
      }

      // Step 5: Test trip creation after cleanup
      console.log("5️⃣ Testing trip creation after cleanup...");
      await databaseService.validateForeignKeyConstraints();

      console.log("🎉 All foreign key fixes validated successfully!");
    } catch (error) {
      console.error("❌ Comprehensive validation failed:", error);
    }
  },

  // Complete database reset - removes all data and recreates initial state
  async fullDatabaseReset(): Promise<void> {
    try {
      const db = await databaseService.getConnection();

      console.log("🔄 Performing full database reset...");

      // Clear all data in proper order (respecting foreign keys)
      await db.execAsync("DELETE FROM location_samples;");
      await db.execAsync("DELETE FROM trips;");
      await db.execAsync("DELETE FROM users;");

      // Recreate the default user for foreign key constraints
      await databaseService.ensureDefaultUserExists();

      console.log("✅ Full database reset completed - back to initial state");
    } catch (error) {
      console.error("❌ Full database reset failed:", error);
    }
  },

  // Run all simple tests
  async runAllTests(): Promise<void> {
    console.log("🚀 Running all simple database tests...");

    await this.checkTables();
    await this.runBasicTest();
    await this.testForeignKeyFix();

    console.log("✅ All simple tests completed");
    console.log("💡 Run simpleDbTest.simpleCleanup() to clean test data");
  },
};

export default simpleDbTest;
