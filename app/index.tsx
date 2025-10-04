import { ThemedText } from "@/components/themed-text";
import { useAuthStore } from "@/stores";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const { user, isOnboarded, isLoading, loadUserFromStorage } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadUserFromStorage();
      setInitialized(true);
    };

    init();
  }, [loadUserFromStorage]);

  if (isLoading || !initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  if (user && isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
