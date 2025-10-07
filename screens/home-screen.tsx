import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  useAuthStore,
  useContactStore,
  useTripSelectors,
  useTripStore,
} from "@/stores";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { activeTrip, startTrip } = useTripStore();
  const { trips, completedTrips } = useTripSelectors();
  const { contacts } = useContactStore();

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
        contacts: contacts.map((contact) => contact.id) || [],
      });
    } catch (error) {
      console.error("Failed to start trip:", error);
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
              {completedTrips.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completed Trips</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {trips.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Trips</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {contacts.length}
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
        {/* Safety Features */}
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
              <ThemedText style={styles.comingSoon}>Active</ThemedText>
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
              <ThemedText style={styles.comingSoon}>Active</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        {/* Location Services Testing Section (Development Only) */}
        <ThemedView style={styles.databaseContainer}>
          <ThemedText type="subtitle" style={styles.databaseTitle}>
            📍 Location Services Testing (Dev Only)
          </ThemedText>
          <ThemedView
            style={[
              styles.databaseCard,
              { backgroundColor: cardBackgroundColor, borderColor },
            ]}
          >
            <ThemedText style={styles.databaseInfo}>
              Section 3A: Google Maps Integration & Location Sharing
            </ThemedText>
            <ThemedView style={styles.databaseButtonsRow}>
              <ThemedButton
                title="Location Demo"
                onPress={() => router.push("/location-services" as any)}
                style={styles.smallTestButton}
                textStyle={styles.smallButtonText}
              />
            </ThemedView>
          </ThemedView>
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
    alignItems: "center",
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 8,
  },
  statCard: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 22,
    marginBottom: 4,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 14,
  },
  tripContainer: {
    marginBottom: 30,
  },
  activeTripCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
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
    marginBottom: 15,
  },
  sosButton: {
    backgroundColor: "#FF5722",
    marginTop: 10,
  },
  sosButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  startTripCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
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
    opacity: 0.7,
  },
  startTripButton: {
    backgroundColor: "#2196F3",
    minWidth: 200,
  },
  startTripButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  featuresList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  comingSoon: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
  },
  // Database Testing Styles (Development)
  databaseContainer: {
    marginBottom: 20,
  },
  databaseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  databaseCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  databaseInfo: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 15,
    textAlign: "center",
  },
  databaseButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "transparent",
  },
  databaseButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  testButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  refreshButton: {
    flex: 1,
    backgroundColor: "#2196F3",
  },
  fixButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    minHeight: 42,
    borderRadius: 8,
  },
  cleanButton: {
    flex: 1,
  },
  smallTestButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    minHeight: 42,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  smallRefreshButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    minHeight: 42,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  smallCleanButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  smallButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
