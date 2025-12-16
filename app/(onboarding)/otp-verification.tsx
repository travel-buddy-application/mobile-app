import { OTPVerificationScreen } from "@/screens/onboarding/otp-verification-screen";
import { useAuthStore } from "@/stores";
import { router } from "expo-router";
import React from "react";

export default function OTPVerificationRoute() {
  const { user, completeOnboardingStep, setOnboardingStep } = useAuthStore();

  const handleVerificationSuccess = () => {
    completeOnboardingStep("otp-verification");
    setOnboardingStep("contacts");
    router.replace("/(onboarding)/emergency-contacts");
  };

  const handleBack = () => {
    router.replace("/(onboarding)/welcome");
  };

  if (!user?.email) {
    router.replace("/(onboarding)/welcome");
    return null;
  }

  return (
    <OTPVerificationScreen
      email={user.email}
      userName={user.name}
      onVerificationSuccess={handleVerificationSuccess}
      onBack={handleBack}
    />
  );
}
