import { PermissionsScreen } from "@/screens/onboarding/permissions-screen";
import { useAuthStore } from "@/stores";
import { router } from "expo-router";
import React from "react";

export default function PermissionsRoute() {
  const { completeOnboarding } = useAuthStore();

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  return <PermissionsScreen onComplete={handleComplete} />;
}
