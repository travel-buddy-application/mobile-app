// Supabase Client Configuration for Travel Buddy
// Handles database connections for location tracking and user data

import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase configuration missing. Please check environment variables:"
  );
  console.warn("- EXPO_PUBLIC_SUPABASE_URL");
  console.warn("- EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

// Create Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable automatic token refresh for mobile apps
    autoRefreshToken: true,
    // Persist auth session in secure storage
    persistSession: true,
    // Configure storage for React Native
    storage: {
      getItem: async (key: string) => {
        // Use Expo SecureStore for auth tokens
        try {
          const { getItemAsync } = await import("expo-secure-store");
          return await getItemAsync(key);
        } catch (error) {
          console.error("Failed to get item from secure storage:", error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          const { setItemAsync } = await import("expo-secure-store");
          await setItemAsync(key, value);
        } catch (error) {
          console.error("Failed to set item in secure storage:", error);
        }
      },
      removeItem: async (key: string) => {
        try {
          const { deleteItemAsync } = await import("expo-secure-store");
          await deleteItemAsync(key);
        } catch (error) {
          console.error("Failed to remove item from secure storage:", error);
        }
      },
    },
  },
  // Configure realtime
  realtime: {
    params: {
      eventsPerSecond: 2, // Limit for location updates
    },
  },
});

// Helper function to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabaseClient
      .from("location")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection error:", error.message);
      return false;
    }

    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Supabase:", error);
    return false;
  }
};

// Export database types for TypeScript
export type Database = {
  public: {
    Tables: {
      location: {
        Row: {
          id: number;
          created_at: string;
          user_id: string | null;
          session_id: string | null;
          lat: string | null;
          lng: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          user_id?: string | null;
          session_id?: string | null;
          lat?: string | null;
          lng?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          user_id?: string | null;
          session_id?: string | null;
          lat?: string | null;
          lng?: string | null;
        };
      };
    };
  };
};

export default supabaseClient;
