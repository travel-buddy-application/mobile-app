// Location Email Service for Travel Buddy
// Handles sending location information to emergency contacts via email

import { Contact, LocationSample } from "@/types/trip";
import { LocationIntegrationService } from "./location-integration.service";

interface LocationEmailParams {
  contactName: string;
  contactEmail: string;
  senderName: string;
  location: LocationSample;
  tripName?: string;
  emergencyMessage?: string;
  isEmergency?: boolean;
}

interface LocationEmailServiceResponse {
  success: boolean;
  message: string;
  emailsSent: number;
}

export class LocationEmailService {
  /**
   * Send location information to a single contact via email
   */
  static async sendLocationToContact(
    params: LocationEmailParams
  ): Promise<boolean> {
    try {
      const {
        contactName,
        contactEmail,
        senderName,
        location,
        tripName = "Safety Trip",
        emergencyMessage = "",
        isEmergency = false,
      } = params;

      // Generate Google Maps URL
      const mapsUrl =
        LocationIntegrationService.generateGoogleMapsUrl(location);

      // Generate location message
      const locationMessage =
        LocationIntegrationService.generateLocationShareMessage(
          location,
          tripName,
          senderName
        );

      console.log("Sending location email:", {
        to: contactEmail,
        isEmergency,
        coordinates: `${location.lat}, ${location.lng}`,
      }); // Use the new dedicated location email service
      const response = await fetch(
        "https://zajzaxnkswpsdwuxpdin.supabase.co/functions/v1/send-location-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            contactPerson: contactName,
            person: senderName,
            receiverEmail: contactEmail,
            tripName: tripName,
            mapsUrl: mapsUrl,
            locationMessage: locationMessage,
            coordinates: {
              latitude: location.lat,
              longitude: location.lng,
              accuracy: location.accuracy,
              timestamp: new Date(location.timestamp).toISOString(),
            },
            isEmergency: isEmergency,
            emergencyMessage: emergencyMessage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      console.log("Location email sent successfully");
      return true;
    } catch (error) {
      console.error("Failed to send location email:", error);
      return false;
    }
  }

  /**
   * Send location information to multiple contacts
   */
  static async sendLocationToMultipleContacts(
    contacts: Contact[],
    senderName: string,
    location: LocationSample,
    tripName?: string,
    emergencyMessage?: string,
    isEmergency: boolean = false
  ): Promise<LocationEmailServiceResponse> {
    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        message: "No contacts provided",
        emailsSent: 0,
      };
    }

    let emailsSent = 0;
    const failures: string[] = [];

    console.log(`Sending location to ${contacts.length} contacts...`);

    // Send emails to all contacts
    const emailPromises = contacts.map(async (contact) => {
      try {
        const success = await this.sendLocationToContact({
          contactName: contact.displayName,
          contactEmail: contact.email,
          senderName,
          location,
          tripName,
          emergencyMessage,
          isEmergency,
        });

        if (success) {
          emailsSent++;
        } else {
          failures.push(contact.displayName);
        }
      } catch (error) {
        console.error(`Failed to send email to ${contact.displayName}:`, error);
        failures.push(contact.displayName);
      }
    });

    // Wait for all emails to complete
    await Promise.allSettled(emailPromises);

    const success = emailsSent > 0;
    const message = success
      ? `Location sent to ${emailsSent}/${contacts.length} contacts${
          failures.length > 0 ? ` (Failed: ${failures.join(", ")})` : ""
        }`
      : `Failed to send location to any contacts`;

    return {
      success,
      message,
      emailsSent,
    };
  }

  /**
   * Send emergency location alert to all emergency contacts
   */
  static async sendEmergencyLocationAlert(
    emergencyContacts: Contact[],
    senderName: string,
    location: LocationSample,
    tripName: string,
    emergencyMessage: string = "I need help! This is my current location."
  ): Promise<LocationEmailServiceResponse> {
    // Filter contacts that should receive emergency alerts
    const alertContacts = emergencyContacts.filter(
      (contact) =>
        contact.sharingPolicy === "all" || contact.sharingPolicy === "alerts"
    );

    if (alertContacts.length === 0) {
      return {
        success: false,
        message: "No emergency contacts configured for alerts",
        emailsSent: 0,
      };
    }

    return this.sendLocationToMultipleContacts(
      alertContacts,
      senderName,
      location,
      tripName,
      emergencyMessage,
      true // isEmergency = true
    );
  }

  /**
   * Send regular location update to location-sharing contacts
   */
  static async sendLocationUpdate(
    contacts: Contact[],
    senderName: string,
    location: LocationSample,
    tripName: string
  ): Promise<LocationEmailServiceResponse> {
    // Filter contacts that should receive location updates
    const locationContacts = contacts.filter(
      (contact) =>
        contact.sharingPolicy === "all" || contact.sharingPolicy === "location"
    );

    if (locationContacts.length === 0) {
      return {
        success: false,
        message: "No contacts configured for location sharing",
        emailsSent: 0,
      };
    }

    return this.sendLocationToMultipleContacts(
      locationContacts,
      senderName,
      location,
      tripName,
      undefined, // no emergency message
      false // isEmergency = false
    );
  }
}
