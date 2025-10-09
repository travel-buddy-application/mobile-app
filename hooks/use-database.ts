import { databaseService } from "@/services/database/database.service";
import { useEffect, useState } from "react";

/**
 * Hook to manage database operations and testing
 * Useful for development and debugging
 */
export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);

  // Get database info
  const refreshDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      const info = await databaseService.getInfo();
      setDbInfo(info);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Run database health check
  const runHealthCheck = async () => {
    try {
      setIsLoading(true);
      const isHealthy = await databaseService.healthCheck();
      setError(null);
      return isHealthy;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Health check failed";
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all database data
  const clearAllData = async () => {
    try {
      setIsLoading(true);
      await databaseService.clearAllData();
      await refreshDatabaseInfo(); // Refresh info after clearing
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear data failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await databaseService.initialize();
        setIsInitialized(true);
        await refreshDatabaseInfo();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Initialization failed");
      }
    };

    initDatabase();
  }, []);
  return {
    isInitialized,
    isLoading,
    error,
    dbInfo,
    // Actions
    refreshDatabaseInfo,
    runHealthCheck,
    clearAllData,
  };
};
