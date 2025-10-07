/**
 * Location FCM Helper Service
 *
 * This service provides helper functions to send FCM notifications
 * with location data that will open Google Maps when tapped.
 */

import { FCMNotificationData } from "../fcm.service";

export interface LocationNotificationParams {
  latitude: number;
  longitude: number;
  locationName?: string;
  contactId?: string;
  tripId?: string;
  message?: string;
}

export class LocationFCMService {
  /**
   * Creates FCM notification data for location updates that will open Google Maps
   */
  static createLocationUpdateNotificationData(
    params: LocationNotificationParams
  ): FCMNotificationData {
    return {
      type: "location_update",
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      locationName: params.locationName,
      contactId: params.contactId,
      tripId: params.tripId,
    };
  }

  /**
   * Creates FCM notification data for location sharing that will open Google Maps
   */
  static createLocationShareNotificationData(
    params: LocationNotificationParams
  ): FCMNotificationData {
    return {
      type: "location_share",
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      locationName: params.locationName,
      contactId: params.contactId,
      tripId: params.tripId,
    };
  }

  /**
   * Creates notification payload for sending via FCM API
   */
  static createLocationNotificationPayload(
    params: LocationNotificationParams,
    recipientToken: string,
    title?: string,
    body?: string
  ) {
    const data = this.createLocationUpdateNotificationData(params);

    return {
      to: recipientToken,
      notification: {
        title: title || "📍 Location Update",
        body:
          body ||
          params.message ||
          `New location${
            params.locationName ? `: ${params.locationName}` : ""
          }. Tap to view on map.`,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      data,
      android: {
        notification: {
          icon: "ic_notification",
          color: "#007AFF",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            category: "LOCATION_UPDATE",
            sound: "default",
          },
        },
      },
    };
  }

  /**
   * Validates location coordinates
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Creates a Google Maps URL for the given coordinates
   */
  static createGoogleMapsUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    locationName?: string
  ): string {
    let url = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;

    if (locationName) {
      url += `&query=${encodeURIComponent(locationName)}`;
    }

    return url;
  }
}
