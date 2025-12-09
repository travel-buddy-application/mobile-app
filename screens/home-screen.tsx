import { ContactSelectorModal } from "@/components/contact-selector-modal";
import { ReceivedTripsSection } from "@/components/received-trips-section";
import { StationaryAlertModal } from "@/components/stationary-alert-modal";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { errorColor, successColor } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import HomeHeader from "@/components/home/Header";
import HomeStats from "@/components/home/Stats";
import TripControls from "@/components/home/TripControls";
import { PeriodicLocationSharingService } from "@/services/location/periodic-location-sharing.service";
import { StationaryDetectionService } from "@/services/location/stationary-detection.service";
import { TripLocationIntegrationService } from "@/services/location/trip-location-integration.service";
import {
  startTripWithContacts as serviceStartTrip,
  endTrip as serviceEndTrip,
} from "@/services/home/trip.service";
import { sendEmergencySOS as serviceSendSOS } from "@/services/home/sos.service";
import {
  useAuthStore,
  useContactStore,
  useLocationStore,
  useTripSelectors,
  useTripStore,
} from "@/stores";
import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SafetyFeatures } from "@/components/home/SafetyFeatures";

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { activeTrip, fetchTrips } = useTripStore();
  const { trips, completedTrips } = useTripSelectors();
  const { contacts } = useContactStore();
  const locationStore = useLocationStore();

  // State for contact selection modal
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // State for stationary alert modal
  const [showStationaryAlert, setShowStationaryAlert] = useState(false);

  // Stationary detection service
  const stationaryService = React.useRef(
    new StationaryDetectionService()
  ).current;

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");

  const handleStartTrip = async () => {
    try {
      // Check for emergency contacts first
      const contactIds = contacts.map((contact) => contact.id);
      console.log("🔍 Safe trip - checking contact IDs:", contactIds);
      console.log("🔍 Available contacts:", contacts.length);

      if (contactIds.length === 0) {
        Alert.alert(
          "Emergency Contacts Required",
          "You need at least one emergency contact to start a safe trip. Please add emergency contacts in the Contacts tab first.",
          [{ text: "Got It" }]
        );
        return;
      }

      // Check that at least one contact is in accepted state
      const acceptedContacts = contacts.filter(
        (contact) => contact.status === "accepted"
      );
      console.log("🔍 Safe trip - accepted contacts:", acceptedContacts.length);

      if (acceptedContacts.length === 0) {
        const pendingContacts = contacts.filter(
          (contact) => contact.status === "pending"
        );
        const declinedContacts = contacts.filter(
          (contact) => contact.status === "declined"
        );

        let message =
          "You need at least one accepted emergency contact to start a safe trip.\n";

        if (pendingContacts.length > 0) {
          message += `You have ${pendingContacts.length} pending contact${
            pendingContacts.length > 1 ? "s" : ""
          } that need${
            pendingContacts.length === 1 ? "s" : ""
          } to accept your invitation.`;
        }

        if (declinedContacts.length > 0) {
          message += `${declinedContacts.length} contact${
            declinedContacts.length > 1 ? "s have" : " has"
          } declined your invitation.`;
        }

        message += " Please check your contacts and try again.";

        Alert.alert("Emergency Contact Not Available", message, [
          { text: "Got It" },
        ]);
        return;
      }

      // Check location permissions before showing contact selector
      const hasLocationPermission =
        await TripLocationIntegrationService.ensureLocationPermissions();
      if (!hasLocationPermission) {
        Alert.alert(
          "Location Permission Required",
          "Location access is required for safe trips. Please grant location permission to continue.",
          [{ text: "OK" }]
        );
        return;
      }

      // Show contact selector modal
      setSelectedContactId(""); // Reset selection
      setShowContactSelector(true);
    } catch (error) {
      Alert.alert("Error", `Failed to start safe trip: ${error}`);
    }
  };

  // Handle contact selection modal actions
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleContactSelectorCancel = () => {
    setShowContactSelector(false);
    setSelectedContactId("");
  };

  const handleContactSelectorConfirm = async () => {
    if (!selectedContactId) {
      Alert.alert("Error", "Please select an emergency contact first.");
      return;
    }

    setShowContactSelector(false);

    // Start trip with selected contact
    try {
      await startTripWithContacts([selectedContactId]);
    } catch (error) {
      Alert.alert("Error", `Failed to start safe trip: ${error}`);
    }
  };

  const startTripWithContacts = async (contactIds: string[]) => {
    try {
      // Get current location first
      let currentLocation;
      try {
        currentLocation = await locationStore.getCurrentPosition();
        if (!currentLocation) {
          throw new Error("No location available");
        }
      } catch (error) {
        console.warn(
          "⚠️ Could not get current location, using default coordinates:",
          error
        );
        currentLocation = {
          lat: 40.7128,
          lng: -74.006,
          accuracy: 100,
          timestamp: Date.now(),
        };
      }

      await TripLocationIntegrationService.startTripWithLocationTracking({
        title: "Safe Trip",
        origin: {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          address: "Current Location",
        },
        destination: {
          lat: currentLocation.lat + 0.01, // Slightly offset for destination
          lng: currentLocation.lng + 0.01,
          address: "Destination",
        },
        contacts: contactIds, // Use actual contact IDs from contact store
      });

      // Ensure location tracking is active after trip starts
      try {
        await locationStore.getCurrentPosition();
        console.log("✅ Location tracking confirmed active after trip start");
      } catch (locationError) {
        console.warn(
          "⚠️ Location tracking may not be fully active:",
          locationError
        );
      } // Get the selected contact name for the success message
      const selectedContact = contacts.find((contact) =>
        contactIds.includes(contact.id)
      );
      const contactName = selectedContact
        ? selectedContact.displayName
        : "emergency contact";

      Alert.alert(
        "Safe Trip Started!",
        `Your safe trip is now active! ${contactName} will be monitoring your journey and can receive your location updates.`
      );

      // Start stationary detection monitoring
      stationaryService.startMonitoring(() => {
        setShowStationaryAlert(true);
      });
    } catch (error) {
      Alert.alert("Error", `Failed to start trip: ${error}`);
    }
  };

  const handleEndTrip = async () => {
    try {
      // Use the home service which stops tracking then ends the trip
      await serviceEndTrip();

      // Stop stationary detection
      stationaryService.stopMonitoring();

      Alert.alert("Success", "Safe trip ended and location tracking stopped!");
    } catch (error) {
      Alert.alert("Error", `Failed to end trip: ${error}`);
    }
  };

  const handleEmergencySOS = async (is_send_immediately = false) => {
    if (!activeTrip) {
      Alert.alert("Cannot Send SOS", "No active trip found.");
      return;
    }

    // Try to get current location if not available
    let currentLocation = locationStore.currentLocation;
    if (!currentLocation) {
      try {
        currentLocation = await locationStore.getCurrentPosition();
        if (!currentLocation) {
          Alert.alert(
            "Cannot Send SOS",
            "Unable to get current location. Please try again."
          );
          return;
        }
      } catch {
        Alert.alert(
          "Cannot Send SOS",
          "Unable to get current location. Please try again."
        );
        return;
      }
    }
    if (!is_send_immediately) {
      Alert.alert(
        "🆘 EMERGENCY SOS",
        "This will immediately alert all your emergency contacts via push notification and email. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "SEND SOS",
            style: "destructive",
            onPress: async () => {
              try {
                // Refresh trip data
                await fetchTrips();
                const currentActiveTrip = activeTrip;

                if (!currentActiveTrip) {
                  Alert.alert("Error", "No active trip found");
                  const { pushResult, emailResult } = await serviceSendSOS();
                  return;
                }

                // Send push notifications
                const pushResult =
                  await PeriodicLocationSharingService.sendManualEmergencyAlert(
                    currentActiveTrip,
                    currentLocation,
                    "🆘 EMERGENCY SOS: I need immediate help!"
                  );

                // Send email notifications
                const emailResult =
                  await TripLocationIntegrationService.sendEmergencyAlert(
                    "Emergency Contact",
                    "🆘 EMERGENCY SOS: I need immediate help! This is my current location."
                  );

                // Show results
                let message = "SOS sent:\n";
                if (pushResult.success) {
                  message += `✅ Push: ${pushResult.sentCount} contacts\n`;
                }
                if (emailResult.success) {
                  message += `✅ Email: ${emailResult.emailsSent} contacts`;
                }

                if (!pushResult.success && !emailResult.success) {
                  message = "❌ Failed to send SOS alerts. Please try again.";
                }

                Alert.alert("🆘 SOS Alert Sent", message);
              } catch (error) {
                Alert.alert("Error", `Failed to send SOS: ${error}`);
              }
            },
          },
        ]
      );
    } else {
      try {
        // Refresh trip data
        await fetchTrips();
        const currentActiveTrip = activeTrip;
        if (!currentActiveTrip) {
          Alert.alert("Error", "No active trip found");
          return;
        }
        // Send push notifications
        await PeriodicLocationSharingService.sendManualEmergencyAlert(
          currentActiveTrip,
          currentLocation,
          "🆘 EMERGENCY SOS: I need immediate help!"
        );
        await TripLocationIntegrationService.sendEmergencyAlert(
          "Emergency Contact",
          "🆘 EMERGENCY SOS: I need immediate help! This is my current location."
        );
        Alert.alert(
          "🆘 SOS Alert Sent",
          "Your emergency contacts have been alerted."
        );
      } catch (error) {
        Alert.alert("Error", `Failed to send SOS: ${error}`);
      }
    }
  };

  const handleStationaryOkay = () => {
    setShowStationaryAlert(false);
    stationaryService.resetTimer();
  };

  const handleStationarySOS = () => {
    setShowStationaryAlert(false);
    handleEmergencySOS(true);
    stationaryService.resetTimer();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <HomeHeader userName={user?.name} />

        {/* Quick Stats */}
        <HomeStats
          completed={completedTrips.length}
          total={trips.length}
          contacts={contacts.length}
        />

        {/* Received Trips Section */}
        <ReceivedTripsSection
          onLocationFetch={(sessionId) => {
            console.log("📍 Location fetched for session:", sessionId);
          }}
        />

        {/* Active Trip or Start Trip */}
        <ThemedView style={styles.tripContainer}>
          <TripControls
            activeTrip={activeTrip}
            onStart={handleStartTrip}
            onEnd={handleEndTrip}
            onSOS={handleEmergencySOS}
            contactsCount={contacts.length}
          />
        </ThemedView>
        {/* Safety Features */}
        <SafetyFeatures />
      </ScrollView>

      {/* Contact Selector Modal */}
      <ContactSelectorModal
        visible={showContactSelector}
        contacts={contacts}
        selectedContactId={selectedContactId}
        onSelectContact={handleContactSelect}
        onCancel={handleContactSelectorCancel}
        onConfirm={handleContactSelectorConfirm}
      />

      {/* Stationary Alert Modal */}
      <StationaryAlertModal
        visible={showStationaryAlert}
        onOkay={handleStationaryOkay}
        onSOS={handleStationarySOS}
      />
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
  // header: {
  //   alignItems: "center",
  //   marginBottom: 30,
  // },
  // appTitleContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 8,
  // },
  // appIcon: {
  //   width: 32,
  //   height: 32,
  //   marginRight: 12,
  // },
  // appTitle: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   marginBottom: 0,
  // },
  // welcomeText: {
  //   fontSize: 16,
  // },
  // statsContainer: {
  //   flexDirection: "row",
  //   marginBottom: 30,
  //   gap: 8,
  // },
  // statCard: {
  //   alignItems: "center",
  //   justifyContent: "flex-start",
  //   flex: 1,
  //   padding: 12,
  //   borderRadius: 12,
  //   borderWidth: 1,
  //   minHeight: 70,
  // },
  // statNumber: {
  //   fontSize: 22,
  //   marginBottom: 4,
  //   fontWeight: "bold",
  // },
  // statLabel: {
  //   fontSize: 11,
  //   opacity: 0.7,
  //   textAlign: "center",
  //   lineHeight: 14,
  // },
  tripContainer: {
    marginBottom: 30,
  },
  // activeTripCard: {
  //   padding: 20,
  //   borderRadius: 12,
  //   backgroundColor: successColor,
  // },
  // activeTripTitle: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   marginBottom: 8,
  // },
  // activeTripSubtitle: {
  //   fontSize: 14,
  //   marginBottom: 4,
  // },
  // activeTripTime: {
  //   fontSize: 12,
  //   marginBottom: 15,
  // },
  // sosButton: {
  //   backgroundColor: errorColor,
  //   marginTop: 10,
  // },
  // sosButtonText: {
  //   color: "white",
  //   fontWeight: "bold",
  // },
  // startTripCard: {
  //   padding: 20,
  //   borderRadius: 12,
  //   alignItems: "center",
  // },
  // startTripTitle: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   marginBottom: 8,
  //   textAlign: "center",
  // },
  // startTripSubtitle: {
  //   fontSize: 14,
  //   textAlign: "center",
  //   marginBottom: 20,
  //   opacity: 0.7,
  // },
  // startTripButton: {
  //   minWidth: 200,
  // },
  // startTripButtonText: {
  //   color: "white",
  //   fontWeight: "bold",
  // },
});

export default HomeScreen;
