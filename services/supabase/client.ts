import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase configuration missing. Please check environment variables:"
  );
  console.warn("- EXPO_PUBLIC_SUPABASE_URL");
  console.warn("- EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: {
      getItem: async (key: string) => {
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
  realtime: {
    params: {
      eventsPerSecond: 2, 
    },
  },
});

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
