import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuthStore } from "@/stores";
import { WelcomeScreen } from "@/screens/onboarding/welcome-screen";

export const OnboardingNavigator: React.FC = () => {
  const { currentOnboardingStep, setOnboardingStep } = useAuthStore();

  const handleWelcomeComplete = () => {
    setOnboardingStep("contacts");
  };

  const handleContactsComplete = () => {
    setOnboardingStep("permissions");
  };

  const handlePermissionsComplete = () => {
    setOnboardingStep("completed");
  };

  // Render appropriate screen based on current step
  switch (currentOnboardingStep) {
    case "profile":
      return <WelcomeScreen onComplete={handleWelcomeComplete} />;

    case "contacts":
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🚧 Emergency Contacts Screen{"\n"}
            (Coming in next step)
          </Text>
        </View>
      );

    case "permissions":
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            🚧 Permissions Screen{"\n"}
            (Coming in next step)
          </Text>
        </View>
      );

    case "completed":
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            ✅ Onboarding Complete!{"\n"}
            Redirecting to main app...
          </Text>
        </View>
      );

    default:
      return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  placeholderText: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    lineHeight: 24,
  },
});
