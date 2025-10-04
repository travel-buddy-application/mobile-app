import * as SQLite from "expo-sqlite";

export interface DatabaseConfig {
  name: string;
  version: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly config: DatabaseConfig;
  private isInitializing = false;
  private isInitialized = false;

  private constructor() {
    this.config = {
      name: "travel_buddy.db",
      version: "1.0.0",
    };
  }

  // Singleton pattern for database connection
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  // Initialize database connection and create tables
  public async initialize(): Promise<void> {
    // Prevent multiple initialization
    if (this.isInitialized) {
      console.log("📋 Database already initialized");
      return;
    }

    if (this.isInitializing) {
      console.log("⏳ Database initialization in progress, waiting...");
      // Wait for current initialization to complete
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;

    try {
      console.log("🗄️ Initializing Travel Buddy Database...");

      // Open database connection
      this.db = await SQLite.openDatabaseAsync(this.config.name);

      console.log("✅ Database connection established");

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      console.log("✅ Database initialization complete");
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      this.db = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
  // Get database connection
  public async getConnection(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    return this.db;
  }

  // Create all database tables
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    console.log("📋 Creating database tables...");

    // Enable foreign key constraints
    await this.db.execAsync("PRAGMA foreign_keys = ON;");

    // Create Users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        profile_picture_url TEXT,
        emergency_info TEXT, -- JSON for emergency medical info, etc.
        preferences TEXT, -- JSON for user preferences
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Trips table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        start_location TEXT, -- JSON: {address, lat, lng}
        end_location TEXT, -- JSON: {address, lat, lng}
        planned_start_time DATETIME,
        actual_start_time DATETIME,
        planned_end_time DATETIME,
        actual_end_time DATETIME,
        status TEXT CHECK(status IN ('planned', 'active', 'completed', 'cancelled', 'emergency')) DEFAULT 'planned',
        trip_type TEXT DEFAULT 'personal', -- 'business', 'leisure', etc.
        emergency_contacts TEXT, -- JSON array of contact IDs
        safety_rules TEXT, -- JSON for custom safety rules
        metadata TEXT, -- JSON for additional trip data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Create Location Samples table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS location_samples (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        accuracy REAL,
        speed REAL,
        heading REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        battery_level REAL,
        is_background BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better query performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips (user_id);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips (created_at);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_location_samples_trip_id ON location_samples (trip_id);
    `);
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_location_samples_timestamp ON location_samples (timestamp);
    `);

    // Ensure default user exists for foreign key constraints
    await this.ensureDefaultUser();

    console.log("✅ Database tables created successfully");
  }

  /**
   * Ensure a default user exists for foreign key constraints
   * This is needed because actual user data is stored in SecureStore
   * but trips need to reference a user_id in the database
   */
  private async ensureDefaultUser(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Check if default user already exists
      const existingUser = await this.db.getFirstAsync(
        "SELECT id FROM users WHERE id = ?",
        "current-user"
      );

      if (!existingUser) {
        // Create default user record for foreign key constraints
        await this.db.runAsync(
          `INSERT INTO users (
            id, name, phone, email, 
            emergency_info, preferences, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          "current-user",
          "Default User",
          "000-000-0000",
          "user@example.com",
          "{}",
          "{}",
          new Date().toISOString(),
          new Date().toISOString()
        );

        console.log("✅ Default user created for foreign key constraints");
      } else {
        console.log("✅ Default user already exists");
      }
    } catch (error) {
      console.error("❌ Error ensuring default user:", error);
      throw error;
    }
  }

  /**
   * Validate that foreign key constraints are working properly
   * This tests the fix for the "current-user" foreign key issue
   */
  public async validateForeignKeyConstraints(): Promise<boolean> {
    try {
      const db = await this.getConnection();

      // Test that we can create a trip with the default user
      const testTripId = `test-fk-${Date.now()}`;
      await db.runAsync(
        `INSERT INTO trips (
          id, user_id, name, description, status, 
          start_location, end_location, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        testTripId,
        "current-user",
        "FK Test Trip",
        "Testing foreign key constraints",
        "planned",
        '{"address": "Test Origin"}',
        '{"address": "Test Destination"}',
        new Date().toISOString(),
        new Date().toISOString()
      );

      // Clean up test trip
      await db.runAsync("DELETE FROM trips WHERE id = ?", testTripId);

      console.log("✅ Foreign key constraints validation passed");
      return true;
    } catch (error) {
      console.error("❌ Foreign key constraints validation failed:", error);
      return false;
    }
  }

  /**
   * Public method to ensure default user exists (for use after cleanup)
   * This can be called after any operation that might have removed the default user
   */
  public async ensureDefaultUserExists(): Promise<void> {
    await this.ensureDefaultUser();
  }

  // Health check - verify database is working
  public async healthCheck(): Promise<boolean> {
    try {
      const db = await this.getConnection();

      // Simple test using execAsync (which we know works)
      await db.execAsync("SELECT 1 FROM users LIMIT 1;");

      console.log("🏥 Database health check - Basic table access successful");
      return true;
    } catch (error) {
      console.error("❌ Database health check failed:", error);
      return false;
    }
  }
  // Get database info for debugging (simplified to avoid query issues)
  public async getInfo(): Promise<any> {
    try {
      const db = await this.getConnection();

      // Just return basic info without complex queries for now
      console.log("📊 Database info - using basic table existence checks");

      let tablesExist = 0;
      try {
        await db.execAsync("SELECT 1 FROM users LIMIT 1;");
        tablesExist++;
      } catch {}

      try {
        await db.execAsync("SELECT 1 FROM trips LIMIT 1;");
        tablesExist++;
      } catch {}

      try {
        await db.execAsync("SELECT 1 FROM location_samples LIMIT 1;");
        tablesExist++;
      } catch {} // Get actual counts using getAllAsync
      let userCount = 0;
      let tripCount = 0;
      let locationCount = 0;

      try {
        const userRows = (await db.getAllAsync(
          "SELECT COUNT(*) as count FROM users"
        )) as any[];
        userCount = userRows[0]?.count || 0;
      } catch (error) {
        console.log("⚠️ Could not count users:", error);
      }

      try {
        const tripRows = (await db.getAllAsync(
          "SELECT COUNT(*) as count FROM trips"
        )) as any[];
        tripCount = tripRows[0]?.count || 0;
      } catch (error) {
        console.log("⚠️ Could not count trips:", error);
      }

      try {
        const locationRows = (await db.getAllAsync(
          "SELECT COUNT(*) as count FROM location_samples"
        )) as any[];
        locationCount = locationRows[0]?.count || 0;
      } catch (error) {
        console.log("⚠️ Could not count location samples:", error);
      }

      return {
        database: this.config.name,
        version: this.config.version,
        tables: [
          { name: "users" },
          { name: "trips" },
          { name: "location_samples" },
        ],
        counts: {
          users: userCount,
          trips: tripCount,
          locations: locationCount,
        },
        tablesAccessible: tablesExist,
      };
    } catch (error) {
      console.error("❌ Failed to get database info:", error);
      return null;
    }
  }

  // Close database connection
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log("🔒 Database connection closed");
    }
  }

  // Clear all data (useful for development/testing)
  public async clearAllData(): Promise<void> {
    try {
      const db = await this.getConnection();

      console.log("🗑️ Clearing all database data...");

      await db.execAsync("DELETE FROM location_samples;");
      await db.execAsync("DELETE FROM trips;");
      await db.execAsync("DELETE FROM users;");

      console.log("✅ All data cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear data:", error);
      throw error;
    }
  }

  // Drop all tables (nuclear option for development)
  public async dropAllTables(): Promise<void> {
    try {
      const db = await this.getConnection();

      console.log("💥 Dropping all database tables...");

      await db.execAsync("DROP TABLE IF EXISTS location_samples;");
      await db.execAsync("DROP TABLE IF EXISTS trips;");
      await db.execAsync("DROP TABLE IF EXISTS users;");

      console.log("✅ All tables dropped successfully");
    } catch (error) {
      console.error("❌ Failed to drop tables:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
