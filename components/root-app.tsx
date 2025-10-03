import { OnboardingNavigator } from "@/navigation/onboarding-navigator";
import { TabNavigator } from "@/navigation/tab-navigator";
import { useAuthStore } from "@/stores";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface RootAppProps {
  children?: React.ReactNode;
}

export const RootApp: React.FC<RootAppProps> = () => {
  const {
    user,
    isOnboarded,
    isLoading,
    error,
    loadUserFromStorage,
    completeOnboarding,
    currentOnboardingStep,
  } = useAuthStore();
  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        await loadUserFromStorage();
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    loadUser();
  }, [loadUserFromStorage]);

  // Handle onboarding completion
  useEffect(() => {
    if (user && currentOnboardingStep === "completed" && !isOnboarded) {
      completeOnboarding();
    }
  }, [user, currentOnboardingStep, isOnboarded, completeOnboarding]);

  // Loading state while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  // Show onboarding if user hasn't completed it
  if (!isOnboarded) {
    return <OnboardingNavigator />;
  }

  // Show Travel Buddy dashboard if user is onboarded
  return <TabNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff4757",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
