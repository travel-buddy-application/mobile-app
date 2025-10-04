// Trip Location Integration Service
// Provides high-level integration between trip management and location tracking

import { useContactStore } from "@/stores/contact/contact.store";
import { useLocationStore } from "@/stores/location/location.store";
import { useTripStore } from "@/stores/trip/trip.store";
import { TripCreateInput } from "@/types/trip";
import { LocationEmailService } from "./location-email.service";

export class TripLocationIntegrationService {
  /**
   * Start a trip with automatic location tracking
   */
  static async startTripWithLocationTracking(
    tripData: TripCreateInput
  ): Promise<void> {
    const tripStore = useTripStore.getState();
    const locationStore = useLocationStore.getState();

    try {
      // Start the trip first
      const newTrip = await tripStore.startTrip(tripData);
      console.log("🚀 Trip started:", newTrip.id);

      // Then start location tracking for this trip
      try {
        await locationStore.startTracking(newTrip.id);
        console.log("📍 Location tracking started for trip:", newTrip.id);
      } catch (locationError) {
        console.warn("⚠️ Failed to start location tracking:", locationError);
        // Trip creation succeeds even if location tracking fails
      }
    } catch (error) {
      console.error("❌ Failed to start trip with location tracking:", error);
      throw error;
    }
  }

  /**
   * End a trip and stop location tracking
   */
  static async endTripAndStopTracking(tripId?: string): Promise<void> {
    const tripStore = useTripStore.getState();
    const locationStore = useLocationStore.getState();

    try {
      // Stop location tracking first
      try {
        locationStore.stopTracking();
        console.log("📍 Location tracking stopped");
      } catch (locationError) {
        console.warn("⚠️ Failed to stop location tracking:", locationError);
        // Continue with trip end even if location stop fails
      }

      // Then end the trip
      await tripStore.endTrip(tripId);
      console.log("🏁 Trip ended with location tracking stopped");
    } catch (error) {
      console.error("❌ Failed to end trip:", error);
      throw error;
    }
  }

  /**
   * Generate shareable location message for current trip
   */
  static async shareCurrentTripLocation(
    userName?: string
  ): Promise<string | null> {
    const tripStore = useTripStore.getState();
    const locationStore = useLocationStore.getState();

    const { activeTrip } = tripStore;
    if (!activeTrip) {
      console.warn("⚠️ No active trip to share location for");
      return null;
    }

    const tripName = activeTrip.title || "Safety Trip";
    return locationStore.generateLocationMessage(tripName, userName);
  }

  /**
   * Generate emergency alert for current trip
   */
  static async generateTripEmergencyAlert(
    userName?: string,
    customMessage?: string
  ): Promise<string | null> {
    const tripStore = useTripStore.getState();
    const locationStore = useLocationStore.getState();

    const { activeTrip } = tripStore;
    if (!activeTrip) {
      console.warn("⚠️ No active trip to generate emergency alert for");
      return null;
    }

    const tripName = activeTrip.title || "Safety Trip";
    return locationStore.generateEmergencyAlert(
      tripName,
      userName,
      customMessage
    );
  }

  /**
   * Get current trip status with location info
   */
  static getCurrentTripStatus() {
    const tripStore = useTripStore.getState();
    const locationStore = useLocationStore.getState();

    const { activeTrip } = tripStore;
    const { isTracking, currentLocation, serviceStatus } = locationStore;

    return {
      hasActiveTrip: !!activeTrip,
      tripId: activeTrip?.id,
      tripTitle: activeTrip?.title,
      isLocationTracking: isTracking,
      locationServiceStatus: serviceStatus,
      hasCurrentLocation: !!currentLocation,
      locationAccuracy: currentLocation?.accuracy,
      lastLocationUpdate: currentLocation?.timestamp,
    };
  }

  /**
   * Check if location permissions are granted and request if needed
   */
  static async ensureLocationPermissions(): Promise<boolean> {
    const locationStore = useLocationStore.getState();

    if (locationStore.permissionStatus === "granted") {
      return true;
    }

    console.log("📍 Requesting location permissions...");
    return await locationStore.requestPermissions();
  }
  /**
   * Initialize location services for trip management
   */
  static async initializeLocationServices(): Promise<boolean> {
    try {
      const hasPermissions = await this.ensureLocationPermissions();

      if (!hasPermissions) {
        console.warn("⚠️ Location permissions not granted");
        return false;
      }

      console.log("✅ Location services initialized for trip management");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize location services:", error);
      return false;
    }
  }

  /**
   * Send current trip location to emergency contacts via email
   */
  static async sendLocationToContacts(
    userName: string = "Travel Buddy User",
    isEmergency: boolean = false,
    emergencyMessage?: string
  ): Promise<{ success: boolean; message: string; emailsSent: number }> {
    const tripStore = useTripStore.getState();
    const locationStore = useLocationStore.getState();
    const contactStore = useContactStore.getState();

    try {
      // Check if we have an active trip
      const { activeTrip } = tripStore;
      if (!activeTrip) {
        return {
          success: false,
          message: "No active trip found",
          emailsSent: 0,
        };
      }

      // Check if we have current location
      const currentLocation = locationStore.currentLocation;
      if (!currentLocation) {
        return {
          success: false,
          message: "No current location available",
          emailsSent: 0,
        };
      }

      // Get emergency contacts
      const { contacts } = contactStore;
      if (contacts.length === 0) {
        return {
          success: false,
          message: "No emergency contacts configured",
          emailsSent: 0,
        };
      }

      const tripName = activeTrip.title || "Safety Trip";

      // Send location via email based on type
      if (isEmergency) {
        return await LocationEmailService.sendEmergencyLocationAlert(
          contacts,
          userName,
          currentLocation,
          tripName,
          emergencyMessage || "I need help! This is my current location."
        );
      } else {
        return await LocationEmailService.sendLocationUpdate(
          contacts,
          userName,
          currentLocation,
          tripName
        );
      }
    } catch (error) {
      console.error("❌ Failed to send location to contacts:", error);
      return {
        success: false,
        message: `Failed to send location: ${error}`,
        emailsSent: 0,
      };
    }
  }

  /**
   * Send emergency alert with location to all emergency contacts
   */
  static async sendEmergencyAlert(
    userName: string = "Travel Buddy User",
    emergencyMessage: string = "EMERGENCY: I need immediate help!"
  ): Promise<{ success: boolean; message: string; emailsSent: number }> {
    return this.sendLocationToContacts(userName, true, emergencyMessage);
  }
}
