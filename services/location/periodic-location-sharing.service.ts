// Periodic Location Sharing Service for Travel Buddy
// Handles automatic location sharing via push notifications during active trips

import { sendPushNotification } from "@/services/notifications.service";
import { useAuthStore } from "@/stores/auth/auth.store";
import { useContactStore } from "@/stores/contact/contact.store";
import { useLocationStore } from "@/stores/location/location.store";
import { LocationSample, Trip } from "@/types/trip";

export class PeriodicLocationSharingService {
  private static instance: PeriodicLocationSharingService;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isSharing = false;
  private readonly SHARE_INTERVAL = 60000; // 1 minute in milliseconds

  private constructor() {}

  static getInstance(): PeriodicLocationSharingService {
    if (!PeriodicLocationSharingService.instance) {
      PeriodicLocationSharingService.instance =
        new PeriodicLocationSharingService();
    }
    return PeriodicLocationSharingService.instance;
  }

  /**
   * Start periodic location sharing for a trip
   */
  async startPeriodicSharing(trip: Trip): Promise<void> {
    if (this.isSharing) {
      console.log("📍 Periodic location sharing already active");
      return;
    }

    // console.log("🚀 Starting periodic location sharing for trip:", trip.title);
    this.isSharing = true;

    // Send trip started notification immediately
    await this.sendTripStartedNotification(trip);

    // Start periodic location sharing
    this.intervalId = setInterval(async () => {
      try {
        await this.shareCurrentLocation(trip);
      } catch (error) {
        console.error("❌ Error in periodic location sharing:", error);
      }
    }, this.SHARE_INTERVAL);

    console.log(
      `✅ Periodic location sharing started (every ${
        this.SHARE_INTERVAL / 1000
      }s)`
    );
  }
  /**
   * Stop periodic location sharing
   */
  stopPeriodicSharing(): void {
    if (!this.isSharing) {
      return;
    }

    console.log("🛑 Stopping periodic location sharing");

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isSharing = false;
    console.log("✅ Periodic location sharing stopped");
  }

  /**
   * Send trip ended notification to all emergency contacts with session info
   */
  async sendTripEndedWithSession(
    trip: Trip,
    sessionId: string,
    userId: string
  ): Promise<void> {
    const eligibleContacts = this.getEligibleContacts();
    const { user } = useAuthStore.getState();
    const userName = user?.name || "Someone";

    if (eligibleContacts.length === 0) {
      console.log("⚠️ No eligible contacts for trip ended notification");
      return;
    }

    console.log(
      `📤 Sending trip ended notification with session to ${eligibleContacts.length} contacts`
    );

    const promises = eligibleContacts.map(async (contact) => {
      try {
        await sendPushNotification({
          token: contact.pushToken!,
          title: `🏁 ${userName} Completed Their Safety Trip`,
          body: `${userName} has safely completed "${
            trip.title || "Safety Trip"
          }". Their live location sharing has ended.`,
          rawData: {
            type: "trip_ended_with_session",
            tripId: trip.id,
            contactId: contact.id,
            userId: userId,
            sessionId: sessionId,
            userName: userName,
            title: trip.title || "Safety Trip",
            timestamp: new Date().toISOString(),
          },
        });
        console.log(
          `✅ Trip ended notification sent to ${contact.displayName}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send trip ended notification to ${contact.displayName}:`,
          error
        );
      }
    });

    await Promise.all(promises);
  }

  /**
   * Check if periodic sharing is currently active
   */
  isPeriodicSharingActive(): boolean {
    return this.isSharing;
  }
  /**
   * Send trip started notification to all emergency contacts
   */
  private async sendTripStartedNotification(trip: Trip): Promise<void> {
    const eligibleContacts = this.getEligibleContacts();

    if (eligibleContacts.length === 0) {
      console.log("⚠️ No eligible contacts for trip started notification");
      return;
    }

    // Get the current user's name from auth store
    const authStore = useAuthStore.getState();
    const userName = authStore.user?.name || "Travel Buddy User";

    console.log(
      `📤 Sending trip started notification to ${eligibleContacts.length} contacts`
    );

    const promises = eligibleContacts.map(async (contact) => {
      try {
        await sendPushNotification({
          token: contact.pushToken!,
          title: `🚀 Trip Started - ${trip.title || "Safety Trip"}`,
          body: `${userName} has started a safety trip. You will receive location updates every minute.`,
          rawData: {
            type: "trip_started",
            tripId: trip.id,
            contactId: contact.id,
            userId: authStore.user?.id || "current-user",
            userName: userName,
            tripTitle: trip.title || "Safety Trip",
            timestamp: new Date().toISOString(),
          },
        });
        console.log(
          `✅ Trip started notification sent to ${contact.displayName}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send trip started notification to ${contact.displayName}:`,
          error
        );
      }
    });

    await Promise.all(promises);
  }

  /**
   * Send trip started notification with session info (new architecture)
   * Replaces periodic location sharing with on-demand fetching
   */
  async sendTripStartedWithSession(
    trip: Trip,
    sessionId: string,
    userId: string
  ): Promise<void> {
    const eligibleContacts = this.getEligibleContacts();

    if (eligibleContacts.length === 0) {
      console.log("⚠️ No eligible contacts for trip started notification");
      return;
    }

    // Get the current user's name from auth store
    const authStore = useAuthStore.getState();
    const userName = authStore.user?.name || "Travel Buddy User";

    console.log(
      `📤 Sending trip started notification with session to ${eligibleContacts.length} contacts`
    );

    const promises = eligibleContacts.map(async (contact) => {
      try {
        await sendPushNotification({
          token: contact.pushToken!,
          title: `🚀 ${userName} Started a Safety Trip`,
          body: `${userName} has started "${
            trip.title || "Safety Trip"
          }". Tap to view their live location when needed.`,
          rawData: {
            type: "trip_started_with_session",
            tripId: trip.id,
            contactId: contact.id,
            userId: userId,
            sessionId: sessionId,
            userName: userName,
            title: trip.title || "Safety Trip",
            timestamp: new Date().toISOString(),
          },
        });
        console.log(
          `✅ Trip started notification sent to ${contact.displayName}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send notification to ${contact.displayName}:`,
          error
        );
      }
    });

    await Promise.all(promises);
  }

  /**
   * Share current location with emergency contacts
   */
  private async shareCurrentLocation(trip: Trip): Promise<void> {
    const locationStore = useLocationStore.getState();
    const eligibleContacts = this.getEligibleContacts();

    // Check if we have current location
    if (!locationStore.currentLocation) {
      console.warn("⚠️ No current location available for periodic sharing");
      return;
    }

    if (eligibleContacts.length === 0) {
      console.warn("⚠️ No eligible contacts for periodic location sharing");
      return;
    }
    const location = locationStore.currentLocation;

    console.log(`📍 Sharing location with ${eligibleContacts.length} contacts`);

    const promises = eligibleContacts.map(async (contact) => {
      try {
        await sendPushNotification({
          token: contact.pushToken!,
          title: `📍 Location Update - ${trip.title || "Safety Trip"}`,
          body: `Current location update. Tap to view on map. Accuracy: ${Math.round(
            location.accuracy
          )}m`,
          rawData: {
            type: "open_maps",
            tripId: trip.id,
            contactId: contact.id,
            userId: "current-user",
            lat: location.lat.toString(),
            lng: location.lng.toString(),
            label: trip.title || "Safety Trip",
            accuracy: location.accuracy.toString(),
            timestamp: new Date(location.timestamp).toISOString(),
          },
        });
      } catch (error) {
        console.error(
          `❌ Failed to send location update to ${contact.displayName}:`,
          error
        );
      }
    });

    await Promise.all(promises);
  }
  /**
   * Get contacts eligible for automatic location sharing
   * (contacts with push tokens and appropriate sharing policies)
   */
  private getEligibleContacts() {
    const contactStore = useContactStore.getState();
    console.log("🔍 Debugging contact filtering for periodic sharing:");
    contactStore.contacts.forEach((contact, index) => {
      console.log(`Contact ${index + 1}:`, {
        name: contact.displayName,
        hasPushToken: !!contact.pushToken,
        pushToken: contact.pushToken
          ? contact.pushToken.substring(0, 20) + "..."
          : "none",
        sharingPolicy: contact.sharingPolicy,
        eligible: !!(
          contact.pushToken &&
          (contact.sharingPolicy === "all" ||
            contact.sharingPolicy === "location" ||
            contact.sharingPolicy === "alerts")
        ),
      });
    });
    const eligibleContacts = contactStore.contacts.filter(
      (contact) =>
        contact.pushToken &&
        (contact.sharingPolicy === "all" ||
          contact.sharingPolicy === "location" ||
          contact.sharingPolicy === "alerts")
    );

    console.log(
      `📊 Periodic sharing: ${eligibleContacts.length} eligible out of ${contactStore.contacts.length} total contacts`
    );

    return eligibleContacts;
  }

  /**
   * Send manual emergency alert (for manual button usage)
   */
  static async sendManualEmergencyAlert(
    trip: Trip,
    location: LocationSample,
    emergencyMessage: string = "🚨 EMERGENCY: I need immediate help!"
  ): Promise<{ success: boolean; sentCount: number; totalContacts: number }> {
    const contactStore = useContactStore.getState();
    console.log("🔍 Debugging contact filtering for emergency alerts:");
    contactStore.contacts.forEach((contact, index) => {
      console.log(`Contact ${index + 1}:`, {
        name: contact.displayName,
        hasPushToken: !!contact.pushToken,
        sharingPolicy: contact.sharingPolicy,
        eligible: !!(
          contact.pushToken &&
          (contact.sharingPolicy === "all" ||
            contact.sharingPolicy === "alerts")
        ),
      });
    });

    // Filter contacts for emergency alerts (different from periodic updates)
    const emergencyContacts = contactStore.contacts.filter(
      (contact) =>
        contact.pushToken &&
        (contact.sharingPolicy === "all" || contact.sharingPolicy === "alerts")
    );

    console.log(
      `📊 Emergency alerts: ${emergencyContacts.length} eligible out of ${contactStore.contacts.length} total contacts`
    );
    if (emergencyContacts.length === 0) {
      return { success: false, sentCount: 0, totalContacts: 0 };
    }

    let successCount = 0;

    console.log(
      `🚨 Sending manual emergency alert to ${emergencyContacts.length} contacts`
    );

    const promises = emergencyContacts.map(async (contact) => {
      try {
        await sendPushNotification({
          token: contact.pushToken!,
          title: `🚨 EMERGENCY ALERT - ${trip.title || "Safety Trip"}`,
          body: `URGENT: Help needed immediately! This is an emergency location alert. Tap to view location and assist.`,
          rawData: {
            type: "open_maps",
            tripId: trip.id,
            contactId: contact.id,
            userId: "current-user",
            lat: location.lat.toString(),
            lng: location.lng.toString(),
            label: `🚨 EMERGENCY - ${trip.title || "Safety Trip"}`,
            accuracy: location.accuracy.toString(),
            timestamp: new Date(location.timestamp).toISOString(),
            emergencyMessage: emergencyMessage,
          },
        });
        successCount++;
        console.log(`✅ Emergency alert sent to ${contact.displayName}`);
      } catch (error) {
        console.error(
          `❌ Failed to send emergency alert to ${contact.displayName}:`,
          error
        );
      }
    });

    await Promise.all(promises);

    return {
      success: successCount > 0,
      sentCount: successCount,
      totalContacts: emergencyContacts.length,
    };
  }
}

// Export singleton instance
export const periodicLocationSharingService =
  PeriodicLocationSharingService.getInstance();
