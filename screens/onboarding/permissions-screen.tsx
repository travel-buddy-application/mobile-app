import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";

interface PermissionsScreenProps {
  onComplete: () => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({
  onComplete,
}) => {
  const backgroundColor = useThemeColor({}, "background");

  const handleGrantPermissions = () => {
    // In a real implementation, this would request actual permissions
    // For now, we'll just complete the onboarding
    onComplete();
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.emoji}>🔐</ThemedText>
          <ThemedText type="title" style={styles.title}>
            Permissions Setup
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Grant permissions to enable safety features
          </ThemedText>
        </ThemedView>

        {/* Permission Cards */}
        <ThemedView style={styles.permissionsList}>
          {/* Location Permission */}
          <ThemedView style={styles.permissionCard}>
            <ThemedText style={styles.permissionIcon}>📍</ThemedText>
            <ThemedView style={styles.permissionInfo}>
              <ThemedText style={styles.permissionTitle}>
                Location Access
              </ThemedText>
              <ThemedText style={styles.permissionDescription}>
                Required to track your location during trips and detect if you
                deviate from your planned route
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Notification Permission */}
          <ThemedView style={styles.permissionCard}>
            <ThemedText style={styles.permissionIcon}>🔔</ThemedText>
            <ThemedView style={styles.permissionInfo}>
              <ThemedText style={styles.permissionTitle}>
                Push Notifications
              </ThemedText>
              <ThemedText style={styles.permissionDescription}>
                Allows us to send you safety check-ins and emergency alerts
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Background App Refresh */}
          <ThemedView style={styles.permissionCard}>
            <ThemedText style={styles.permissionIcon}>🔄</ThemedText>
            <ThemedView style={styles.permissionInfo}>
              <ThemedText style={styles.permissionTitle}>
                Background App Refresh
              </ThemedText>
              <ThemedText style={styles.permissionDescription}>
                Enables continuous safety monitoring even when the app is in the
                background
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView style={styles.actionButtons}>
          <ThemedButton
            title="Grant Permissions & Complete Setup"
            onPress={handleGrantPermissions}
            style={styles.grantButton}
            textStyle={styles.grantButtonText}
          />
          <ThemedText style={styles.infoText}>
            You can modify these permissions later in your device settings
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 32,
  },
  emoji: {
    padding: 30,
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  permissionsList: {
    marginBottom: 40,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionIcon: {
    padding: 10,
    fontSize: 32,
    marginRight: 16,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 16,
  },
  grantButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  grantButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
});
