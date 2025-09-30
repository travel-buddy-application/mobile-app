import { EmergencyContactsScreen } from "@/screens/onboarding/emergency-contacts-screen";
import { PermissionsScreen } from "@/screens/onboarding/permissions-screen";
import { WelcomeScreen } from "@/screens/onboarding/welcome-screen";
import { useAuthStore } from "@/stores";
import React from "react";

export const OnboardingNavigator: React.FC = () => {
  const { currentOnboardingStep, setOnboardingStep } = useAuthStore();

  const handleWelcomeComplete = () => {
    setOnboardingStep("contacts");
  };

  const handleContactsComplete = () => {
    setOnboardingStep("permissions");
  };
  const handlePermissionsComplete = () => {
    // The permissions screen handles completion internally
    // This is just a fallback in case it's needed
    setOnboardingStep("completed");
  };

  // Render appropriate screen based on current step
  switch (currentOnboardingStep) {
    case "profile":
      return <WelcomeScreen onComplete={handleWelcomeComplete} />;
    case "contacts":
      return (
        <EmergencyContactsScreen
          onComplete={handleContactsComplete}
          onSkip={handleContactsComplete}
        />
      );
    case "permissions":
      return <PermissionsScreen onComplete={handlePermissionsComplete} />;
    case "completed":
      // This should not be reached as the auth store will redirect to main app
      return null;
    default:
      return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }
};
