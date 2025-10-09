/**
 * Trip Completion Notification Service
 * Handles sending push notifications when trips are completed
 */

import { useAuthStore } from "@/stores/auth/auth.store";
import { useContactStore } from "@/stores/contact/contact.store";
import { Trip } from "@/types/trip";
import { sendPushNotification } from "./notifications.service";

export class TripCompletionNotificationService {
  /**
   * Send trip completion notifications to all emergency contacts
   */
  static async sendTripCompletionNotifications(completedTrip: Trip): Promise<{
    success: boolean;
    message: string;
    notificationsSent: number;
  }> {
    try {
      console.log(
        "🔔 Starting trip completion notifications for:",
        completedTrip.id
      );

      // Get user and contact information
      const contactStore = useContactStore.getState();
      const authStore = useAuthStore.getState();
      const user = authStore.user;

      if (!user) {
        return {
          success: false,
          message: "User not found",
          notificationsSent: 0,
        };
      }

      // Get trip contacts
      const tripContacts = contactStore.contacts.filter((contact) =>
        completedTrip.contacts.includes(contact.id)
      );

      if (tripContacts.length === 0) {
        return {
          success: false,
          message: "No contacts found for this trip",
          notificationsSent: 0,
        };
      }

      // Filter contacts that can receive notifications
      const notifiableContacts = tripContacts.filter(
        (contact) =>
          contact.pushToken &&
          contact.status === "accepted" &&
          (contact.sharingPolicy === "all" ||
            contact.sharingPolicy === "alerts")
      );

      if (notifiableContacts.length === 0) {
        return {
          success: false,
          message:
            "No contacts available for notifications (no push tokens or invalid permissions)",
          notificationsSent: 0,
        };
      }

      // Calculate trip duration
      const startTime = new Date(completedTrip.startAt);
      const endTime = completedTrip.endAt
        ? new Date(completedTrip.endAt)
        : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60)
      );

      const durationText =
        durationHours > 0
          ? `${durationHours}h ${durationMinutes}m`
          : `${durationMinutes}m`;

      // Create notification content
      const userName = user.name || "Travel Buddy User";
      const tripTitle = completedTrip.title || "Safety Trip";
      const destinationAddress =
        completedTrip.destination.address || "their destination";

      const title = `${userName} completed their trip`;
      const body = `${userName} has safely completed their trip "${tripTitle}" to ${destinationAddress}. Trip duration: ${durationText}`;

      // Send notifications to all contacts
      let notificationsSent = 0;
      const notificationPromises = notifiableContacts.map(async (contact) => {
        try {
          await sendPushNotification({
            token: contact.pushToken!,
            title,
            body,
            rawData: {
              type: "trip_ended_with_session",
              tripId: completedTrip.id,
              userId: user.id,
              sessionId: completedTrip.id, // Use trip ID as session ID for compatibility
              userName,
              title: tripTitle,
              body: `${userName} has safely completed "${tripTitle}"`,
              duration: durationText,
              destination: destinationAddress,
              completedAt: endTime.toISOString(),
            },
          });

          console.log(
            `✅ Trip completion notification sent to: ${contact.displayName}`
          );
          notificationsSent++;
        } catch (error) {
          console.error(
            `❌ Failed to send notification to ${contact.displayName}:`,
            error
          );
        }
      });

      // Wait for all notifications to complete
      await Promise.allSettled(notificationPromises);

      const successMessage = `Trip completion notifications sent to ${notificationsSent} of ${notifiableContacts.length} contacts`;
      console.log(`🔔 ${successMessage}`);

      return {
        success: notificationsSent > 0,
        message: successMessage,
        notificationsSent,
      };
    } catch (error) {
      console.error("❌ Failed to send trip completion notifications:", error);
      return {
        success: false,
        message: `Failed to send notifications: ${error}`,
        notificationsSent: 0,
      };
    }
  }

  /**
   * Send a personalized trip completion notification to a specific contact
   */ static async sendPersonalizedNotification(
    contact: { pushToken: string; displayName: string },
    completedTrip: Trip,
    userName: string
  ): Promise<boolean> {
    try {
      // Get user information
      const authStore = useAuthStore.getState();
      const user = authStore.user;

      const tripTitle = completedTrip.title || "Safety Trip";
      const destinationAddress =
        completedTrip.destination.address || "their destination";

      // Calculate trip duration
      const startTime = new Date(completedTrip.startAt);
      const endTime = completedTrip.endAt
        ? new Date(completedTrip.endAt)
        : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60)
      );

      const durationText =
        durationHours > 0
          ? `${durationHours}h ${durationMinutes}m`
          : `${durationMinutes}m`;

      const title = `${userName} completed their trip`;
      const body = `Good news! ${userName} has safely arrived at ${destinationAddress} after a ${durationText} trip. They're safe and sound! 🎉`;

      await sendPushNotification({
        token: contact.pushToken,
        title,
        body,
        rawData: {
          type: "trip_ended_with_session",
          tripId: completedTrip.id,
          userId: user?.id || "unknown",
          sessionId: completedTrip.id, // Use trip ID as session ID for compatibility
          userName,
          title: tripTitle,
          body: `${userName} has safely completed "${tripTitle}"`,
          duration: durationText,
          destination: destinationAddress,
          completedAt: endTime.toISOString(),
          personalizedFor: contact.displayName,
        },
      });

      console.log(
        `✅ Personalized trip completion notification sent to: ${contact.displayName}`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to send personalized notification to ${contact.displayName}:`,
        error
      );
      return false;
    }
  }
}
