// Location Services Demo Screen
// Showcases the Google Maps integration and location sharing features

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LocationIntegrationService } from "@/services/location/location-integration.service";
import { PeriodicLocationSharingService } from "@/services/location/periodic-location-sharing.service";
import { TripLocationIntegrationService } from "@/services/location/trip-location-integration.service";
import { useContactStore } from "@/stores/contact/contact.store";
import { useLocationStore } from "@/stores/location/location.store";
import { useTripStore } from "@/stores/trip/trip.store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LocationServicesScreen() {
  const [status, setStatus] = useState("");
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const locationStore = useLocationStore();
  const tripStore = useTripStore();
  const contactStore = useContactStore();

  // Get current status
  const tripStatus = TripLocationIntegrationService.getCurrentTripStatus();

  useEffect(() => {
    updateStatus();
  }, [locationStore.isTracking, tripStore.activeTrip]);

  const updateStatus = () => {
    const status = TripLocationIntegrationService.getCurrentTripStatus();
    setStatus(
      `Trip: ${status.hasActiveTrip ? status.tripTitle : "None"} | Location: ${
        status.isLocationTracking ? "Tracking" : "Stopped"
      }`
    );
  };

  const handleStartTripWithLocation = async () => {
    try {
      await TripLocationIntegrationService.startTripWithLocationTracking({
        title: "Demo Safety Trip",
        origin: {
          lat: 40.7128,
          lng: -74.006,
          address: "New York, NY",
        },
        destination: {
          lat: 40.7589,
          lng: -73.9851,
          address: "Times Square, NY",
        },
        contacts: [], // In real app, this would have contact IDs
      });

      Alert.alert("Success", "Trip started with location tracking!");
      updateStatus();
    } catch (error) {
      Alert.alert("Error", `Failed to start trip: ${error}`);
    }
  };

  const handleEndTripAndStopLocation = async () => {
    try {
      await TripLocationIntegrationService.endTripAndStopTracking();
      Alert.alert("Success", "Trip ended and location tracking stopped!");
      updateStatus();
      setShareableUrl(null);
      setLocationMessage(null);
    } catch (error) {
      Alert.alert("Error", `Failed to end trip: ${error}`);
    }
  };

  const handleGenerateShareableUrl = async () => {
    if (!locationStore.currentLocation) {
      Alert.alert("No Location", "No current location available");
      return;
    }

    const url = LocationIntegrationService.generateGoogleMapsUrl(
      locationStore.currentLocation
    );
    setShareableUrl(url);
    Alert.alert(
      "URL Generated",
      "Google Maps URL generated! You can share or open it."
    );
  };

  const handleGenerateLocationMessage = async () => {
    const message =
      await TripLocationIntegrationService.shareCurrentTripLocation(
        "Demo User"
      );
    setLocationMessage(message);

    if (message) {
      Alert.alert("Message Generated", "Location share message created!");
    } else {
      Alert.alert("No Location", "No current location or active trip");
    }
  };

  const handleGenerateEmergencyAlert = async () => {
    const alert =
      await TripLocationIntegrationService.generateTripEmergencyAlert(
        "Demo User",
        "This is a test emergency alert"
      );

    if (alert) {
      Alert.alert("Emergency Alert", alert, [
        {
          text: "Copy",
          onPress: () => {
            /* In real app, copy to clipboard */
          },
        },
        { text: "Share", onPress: () => shareMessage(alert) },
        { text: "Close", style: "cancel" },
      ]);
    } else {
      Alert.alert("No Location", "No current location or active trip");
    }
  };

  const shareMessage = async (message: string) => {
    try {
      await Share.share({
        message: message,
        title: "Travel Buddy Location",
      });
    } catch (error) {
      console.error("Failed to share message:", error);
    }
  };
  const openInMaps = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open Google Maps");
    }
  };

  const handleRequestPermissions = async () => {
    const granted =
      await TripLocationIntegrationService.ensureLocationPermissions();
    Alert.alert(
      "Permissions",
      granted ? "Location permissions granted!" : "Location permissions denied"
    );
  };
  const handleGetCurrentLocation = async () => {
    try {
      const location = await locationStore.getCurrentPosition();
      if (location) {
        Alert.alert(
          "Current Location",
          `Lat: ${location.lat.toFixed(6)}\nLng: ${location.lng.toFixed(
            6
          )}\nAccuracy: ${location.accuracy}m`
        );
      } else {
        Alert.alert("Error", "Could not get current location");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to get location: ${error}`);
    }
  };
  const handleSendLocationEmail = async () => {
    if (contactStore.contacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Please add emergency contacts first in the Contacts tab to send location updates."
      );
      return;
    }

    try {
      const result =
        await TripLocationIntegrationService.sendLocationToContacts(
          "Demo User",
          false // not an emergency
        );

      if (result.success) {
        Alert.alert(
          "Location Sent!",
          `Successfully sent location to ${result.emailsSent} emergency contacts via email.`
        );
      } else {
        Alert.alert("Failed to Send", result.message);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to send location via email: ${error}`);
    }
  };
  const handleSendEmergencyLocationEmail = async () => {
    if (contactStore.contacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Please add emergency contacts first in the Contacts tab to send emergency alerts."
      );
      return;
    }

    try {
      const result = await TripLocationIntegrationService.sendEmergencyAlert(
        "Demo User",
        "🚨 EMERGENCY: I need immediate help! This is my current location."
      );

      if (result.success) {
        Alert.alert(
          "Emergency Alert Sent!",
          `Emergency location alert sent to ${result.emailsSent} emergency contacts via email.`
        );
      } else {
        Alert.alert("Failed to Send Emergency Alert", result.message);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to send emergency alert: ${error}`);
    }
  };
  // Removed manual location FCM function - now handled automatically every 1 minute during active trips
  const handleSendEmergencyFCM = async () => {
    if (contactStore.contacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Please add emergency contacts first in the Contacts tab to send emergency alerts."
      );
      return;
    }

    if (!locationStore.currentLocation || !tripStatus.hasActiveTrip) {
      Alert.alert(
        "Cannot Send Emergency Alert",
        "No active trip or current location available."
      );
      return;
    }

    if (!tripStore.activeTrip) {
      Alert.alert("Error", "No active trip found");
      return;
    }

    try {
      // Use the new manual emergency alert service
      const result =
        await PeriodicLocationSharingService.sendManualEmergencyAlert(
          tripStore.activeTrip,
          locationStore.currentLocation,
          "🚨 EMERGENCY: I need immediate help! This is my current location."
        );

      if (result.success) {
        Alert.alert(
          "🚨 Emergency Alerts Sent!",
          `Emergency alerts sent to ${result.sentCount}/${result.totalContacts} emergency contacts via push notification.`
        );
      } else {
        Alert.alert(
          "No Emergency Contacts",
          "No contacts have push notifications enabled for emergency alerts."
        );
      }
    } catch (error) {
      Alert.alert("Error", `Failed to send emergency alerts: ${error}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          Location Services Demo
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Google Maps Integration & Location Sharing
        </ThemedText>
        {/* Status Card */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Current Status
          </ThemedText>
          <ThemedText style={styles.statusText}>{status}</ThemedText>

          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Permission:</ThemedText>
            <ThemedText
              style={[
                styles.statusValue,
                {
                  color:
                    locationStore.permissionStatus === "granted"
                      ? "#4CAF50"
                      : "#F44336",
                },
              ]}
            >
              {locationStore.permissionStatus}
            </ThemedText>
          </View>

          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>Service:</ThemedText>
            <ThemedText
              style={[
                styles.statusValue,
                {
                  color:
                    locationStore.serviceStatus === "running"
                      ? "#4CAF50"
                      : "#757575",
                },
              ]}
            >
              {locationStore.serviceStatus}
            </ThemedText>
          </View>

          {locationStore.currentLocation && (
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Accuracy:</ThemedText>
              <ThemedText style={styles.statusValue}>
                {locationStore.currentLocation.accuracy}m
              </ThemedText>
            </View>
          )}
        </View>
        {/* Trip Management */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Trip Management
          </ThemedText>
          {!tripStatus.hasActiveTrip && (
            <ThemedText
              style={[styles.statusText, { marginBottom: 12, fontSize: 12 }]}
            >
              Starting a trip will automatically:
              {"\n"}• Send trip started notification to emergency contacts
              {"\n"}• Begin location tracking every 10 seconds
              {"\n"}• Share location via push notifications every 1 minute
            </ThemedText>
          )}
          <ThemedButton
            title={
              tripStatus.hasActiveTrip
                ? "✅ Trip Currently Active"
                : "🚀 Start Trip with Location"
            }
            onPress={handleStartTripWithLocation}
            style={styles.button}
            type={tripStatus.hasActiveTrip ? "success" : "default"}
            disabled={tripStatus.hasActiveTrip}
          />
          <ThemedButton
            title="🛑 End Trip & Stop Tracking"
            onPress={handleEndTripAndStopLocation}
            style={[styles.button, styles.secondaryButton]}
            disabled={!tripStatus.hasActiveTrip}
          />
        </View>
        {/* Location Services */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Location Services
          </ThemedText>
          <ThemedButton
            title="🔐 Request Location Permissions"
            onPress={handleRequestPermissions}
            style={styles.button}
          />
          <ThemedButton
            title="📍 Get Current Location"
            onPress={handleGetCurrentLocation}
            style={styles.button}
          />
        </View>
        {/* Google Maps Integration */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Google Maps Integration
          </ThemedText>
          <ThemedButton
            title="🔗 Generate Google Maps URL"
            onPress={handleGenerateShareableUrl}
            style={styles.button}
            disabled={!locationStore.currentLocation}
          />
          {shareableUrl && (
            <View style={styles.urlContainer}>
              <ThemedText style={styles.urlText} numberOfLines={2}>
                {shareableUrl}
              </ThemedText>
              <View style={styles.urlActions}>
                <TouchableOpacity
                  style={styles.urlButton}
                  onPress={() => openInMaps(shareableUrl)}
                >
                  <Text style={styles.urlButtonText}>🗺️ Open Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.urlButton, { backgroundColor: "#4CAF50" }]}
                  onPress={() => shareMessage(shareableUrl)}
                >
                  <Text style={styles.urlButtonText}>📤 Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        {/* Location Sharing */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Location Sharing
          </ThemedText>
          <ThemedButton
            title="💬 Generate Location Message"
            onPress={handleGenerateLocationMessage}
            style={styles.button}
            disabled={
              !tripStatus.hasActiveTrip || !locationStore.currentLocation
            }
          />
          <ThemedButton
            title="🚨 Generate Emergency Alert"
            onPress={handleGenerateEmergencyAlert}
            style={[styles.button, styles.emergencyButton]}
            type="delete"
            disabled={
              !tripStatus.hasActiveTrip || !locationStore.currentLocation
            }
          />
          {locationMessage && (
            <View style={styles.messageContainer}>
              <ThemedText style={styles.messageText}>
                {locationMessage}
              </ThemedText>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareMessage(locationMessage)}
              >
                <Text style={styles.shareButtonText}>📤 Share Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* Email Location Sharing */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            📧 Email Location Sharing
          </ThemedText>

          <ThemedText style={styles.statusText}>
            Contacts: {contactStore.contacts.length} configured
          </ThemedText>

          <ThemedButton
            title="📧 Send Location to Emergency Contacts"
            onPress={handleSendLocationEmail}
            style={styles.button}
            disabled={
              !tripStatus.hasActiveTrip ||
              !locationStore.currentLocation ||
              contactStore.contacts.length === 0
            }
          />

          <ThemedButton
            title="🚨 Send Emergency Location Alert"
            onPress={handleSendEmergencyLocationEmail}
            style={[styles.button, styles.emergencyButton]}
            type="delete"
            disabled={
              !tripStatus.hasActiveTrip ||
              !locationStore.currentLocation ||
              contactStore.contacts.length === 0
            }
          />
        </View>
        {/* FCM Push Notifications */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            🔔 FCM Push Notifications
          </ThemedText>
          <ThemedText style={styles.statusText}>
            FCM Contacts:
            {contactStore.contacts.filter((c) => c.pushToken).length} with push
            tokens
          </ThemedText>
          <ThemedText
            style={[
              styles.statusText,
              {
                marginBottom: 12,
                fontStyle: "normal",
                color: tripStore.isPeriodicSharingActive()
                  ? "#4CAF50"
                  : "#757575",
              },
            ]}
          >
            📍 Automatic Location Sharing:
            {tripStore.isPeriodicSharingActive()
              ? "Active (every 1 minute)"
              : "Inactive"}
          </ThemedText>
          <ThemedText
            style={[styles.statusText, { marginBottom: 16, fontSize: 12 }]}
          >
            Location updates are automatically sent to emergency contacts every
            minute during active trips.
          </ThemedText>
          <ThemedButton
            title="🚨 Send Emergency Alert (Manual)"
            onPress={handleSendEmergencyFCM}
            style={[styles.button, styles.emergencyButton]}
            type="delete"
            disabled={
              !tripStatus.hasActiveTrip ||
              !locationStore.currentLocation ||
              contactStore.contacts.filter(
                (c) =>
                  c.pushToken &&
                  (c.sharingPolicy === "all" || c.sharingPolicy === "alerts")
              ).length === 0
            }
          />
        </View>
        <View style={styles.spacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginTop: 50,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardTitle: {
    color: "#333",
    marginBottom: 12,
    fontSize: 16,
  },
  statusText: {
    color: "#555",
    marginBottom: 12,
    fontStyle: "italic",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusLabel: {
    color: "#555",
    fontWeight: "500",
  },
  statusValue: {
    color: "#555",
    fontWeight: "600",
  },
  button: {
    marginBottom: 14,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  secondaryButton: {
    backgroundColor: "#6B7280",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#6B7280",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emergencyButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    elevation: 6,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  urlContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  urlText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#333",
    marginBottom: 8,
  },
  urlActions: {
    flexDirection: "row",
    gap: 8,
  },
  urlButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  urlButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  messageContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  messageText: {
    color: "#333",
    fontSize: 14,
    marginBottom: 8,
  },
  shareButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  spacer: {
    height: 32,
  },
});
