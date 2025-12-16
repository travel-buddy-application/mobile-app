import { useTripStore } from "@/stores/trip/trip.store";
import { useEffect, useState } from "react";

interface UseTripStoreInitializationOptions {
  enabled?: boolean;
}

export const useTripStoreInitialization = (
  options: UseTripStoreInitializationOptions = {}
) => {
  const { enabled = true } = options;
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initializeFromDatabase = useTripStore(
    (state) => state.initializeFromDatabase
  );

  useEffect(() => {
    if (!enabled) {
      setIsInitialized(false);
      return;
    }

    const initializeStore = async () => {
      try {
        console.log("🔄 Starting trip store initialization...");
        await initializeFromDatabase();
        setIsInitialized(true);
        setInitError(null);
        console.log("✅ Trip store initialization complete");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setInitError(errorMessage);
        console.error("❌ Failed to initialize trip store:", error);
      }
    };

    initializeStore();
  }, [enabled, initializeFromDatabase]);

  return {
    isInitialized,
    initError,
  };
};
