import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuthStore, useTripStore } from "@/stores";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { activeTrip, startTrip } = useTripStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");
  const textColor = useThemeColor({}, "primaryButtonText");
  const handleStartTrip = async () => {
    try {
      await startTrip({
        title: "Safety Trip",
        origin: {
          lat: 0, // This will be updated with real location
          lng: 0,
          address: "Current Location",
        },
        destination: {
          lat: 0, // Will be from user input
          lng: 0,
          address: "Destination",
        },
        contacts: user?.emergencyContacts?.map((contact) => contact.id) || [],
      });
    } catch (error) {
      console.error("Failed to start trip:", error);
    }
  };
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.appTitle}>
            🧳 Travel Buddy
          </ThemedText>
          <ThemedText style={styles.welcomeText}>
            Welcome back, {user?.name || "Traveler"}!
          </ThemedText>
        </ThemedView>

        {/* Quick Stats */}
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              0
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completed Trips</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {user?.emergencyContacts?.length || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Emergency Contacts</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Active Trip or Start Trip */}
        <ThemedView style={styles.tripContainer}>
          {activeTrip ? (
            <ThemedView style={styles.activeTripCard}>
              <ThemedText
                type="subtitle"
                style={[styles.activeTripTitle, { color: textColor }]}
              >
                🚗 Active Trip
              </ThemedText>
              <ThemedText
                style={[styles.activeTripSubtitle, { color: textColor }]}
              >
                Status: {activeTrip.status}
              </ThemedText>
              <ThemedText style={[styles.activeTripTime, { color: textColor }]}>
                Started: {new Date(activeTrip.startAt).toLocaleTimeString()}
              </ThemedText>
              <ThemedButton
                title="🆘 Emergency SOS"
                type="delete"
                style={styles.sosButton}
                textStyle={styles.sosButtonText}
              />
            </ThemedView>
          ) : (
            <ThemedView style={styles.startTripCard}>
              <ThemedText type="subtitle" style={styles.startTripTitle}>
                Ready for a safe journey?
              </ThemedText>
              <ThemedText style={styles.startTripSubtitle}>
                Start a protected trip to enable safety monitoring
              </ThemedText>
              <ThemedButton
                title="🛡️ Start Safe Trip"
                onPress={handleStartTrip}
                style={styles.startTripButton}
                textStyle={styles.startTripButtonText}
              />
            </ThemedView>
          )}
        </ThemedView>

        {/* Features Coming Soon */}
        <ThemedView style={styles.featuresContainer}>
          <ThemedText type="subtitle" style={styles.featuresTitle}>
            Safety Features
          </ThemedText>
          <ThemedView
            style={[
              styles.featuresList,
              { backgroundColor: cardBackgroundColor },
            ]}
          >
            <ThemedView
              style={[styles.featureItem, { borderBottomColor: borderColor }]}
            >
              <ThemedText style={styles.featureIcon}>📍</ThemedText>
              <ThemedText style={styles.featureText}>
                Real-time Location Sharing
              </ThemedText>
              <ThemedText style={styles.comingSoon}>Coming Soon</ThemedText>
            </ThemedView>
            <ThemedView
              style={[styles.featureItem, { borderBottomColor: borderColor }]}
            >
              <ThemedText style={styles.featureIcon}>⚠️</ThemedText>
              <ThemedText style={styles.featureText}>
                Route Deviation Detection
              </ThemedText>
              <ThemedText style={styles.comingSoon}>Coming Soon</ThemedText>
            </ThemedView>
            <ThemedView
              style={[styles.featureItem, { borderBottomColor: borderColor }]}
            >
              <ThemedText style={styles.featureIcon}>📱</ThemedText>
              <ThemedText style={styles.featureText}>
                Smart SOS Alerts
              </ThemedText>
              <ThemedText style={styles.comingSoon}>Coming Soon</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Debug Section (temporary) */}
        <ThemedView style={styles.debugContainer}>
          <ThemedText style={styles.debugTitle}>Debug Actions</ThemedText>
          <ThemedButton
            title="🔄 Reset App"
            onPress={handleLogout}
            style={styles.debugButton}
            textStyle={styles.debugButtonText}
          />
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
    padding: 20,
  },
  header: {
    marginTop: 50,
    alignItems: "center",
    marginBottom: 30,
  },
  appTitle: {
    padding: 10,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  tripContainer: {
    marginBottom: 30,
  },
  activeTripCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4caf50",
    backgroundColor: "#e8f5e8",
  },
  activeTripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  activeTripSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  activeTripTime: {
    fontSize: 12,
    marginBottom: 16,
  },
  sosButton: {
    backgroundColor: "#ff4757",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  startTripCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startTripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  startTripSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  startTripButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  startTripButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  featuresList: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  comingSoon: {
    fontSize: 12,
    fontStyle: "italic",
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  debugButton: {
    backgroundColor: "#666",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  debugButtonText: {
    color: "#fff",
    fontSize: 12,
  },
});
