import { WelcomeScreen } from "@/screens/onboarding/welcome-screen";
import { useAuthStore } from "@/stores";
import { router } from "expo-router";
import React from "react";

export default function WelcomeRoute() {
  const { completeOnboardingStep, setOnboardingStep } = useAuthStore();

  const handleComplete = () => {
    completeOnboardingStep("profile");
    setOnboardingStep("otp-verification");
    router.replace("/(onboarding)/otp-verification");
  };

  return <WelcomeScreen onComplete={handleComplete} />;
}
