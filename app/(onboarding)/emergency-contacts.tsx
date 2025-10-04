import { EmergencyContactsScreen } from "@/screens/onboarding/emergency-contacts-screen";
import { useAuthStore } from "@/stores";
import { router } from "expo-router";
import React from "react";

export default function EmergencyContactsRoute() {
  const { completeOnboardingStep, setOnboardingStep } = useAuthStore();

  const handleComplete = () => {
    completeOnboardingStep("contacts");
    setOnboardingStep("permissions");
    router.replace("/(onboarding)/permissions");
  };

  const handleSkip = () => {
    completeOnboardingStep("contacts");
    setOnboardingStep("permissions");
    router.replace("/(onboarding)/permissions");
  };

  return (
    <EmergencyContactsScreen onComplete={handleComplete} onSkip={handleSkip} />
  );
}
