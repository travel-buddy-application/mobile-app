import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTripStoreInitialization } from "@/hooks/use-trip-store-initialization";
import { databaseService } from "@/services/database/database.service";
import { fcmService } from "@/services/fcm.service";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  // Initialize trip store only after database is ready
  const { isInitialized: isTripStoreReady } = useTripStoreInitialization({
    enabled: isDatabaseReady,
  });

  // Initialize database on app start
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log("🚀 Initializing Travel Buddy services...");

        // Initialize database
        await databaseService.initialize();

        // Initialize FCM notifications
        await fcmService.initialize();

        // Run health check
        const isHealthy = await databaseService.healthCheck();
        if (isHealthy) {
          console.log("✅ Database ready for Travel Buddy");
          setIsDatabaseReady(true);
        } else {
          console.error("❌ Database health check failed");
        }
      } catch (error) {
        console.error("💥 Services initialization error:", error);
        // Still allow app to continue with AsyncStorage fallback
        setIsDatabaseReady(true);
      }
    };

    initializeServices();
  }, []);
  // Show loading screen while database and trip store initialize
  if (!isDatabaseReady || !isTripStoreReady) {
    return null; // You could show a splash screen here
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="invite" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}
