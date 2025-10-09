// Location Integration Service for Travel Buddy
// Integrates location tracking with trip lifecycle and database storage

import { LocationSample } from "@/types/trip";
// TripDatabaseService import removed - using Supabase instead

interface GoogleMapsConfig {
  enableSharing: boolean;
  includeName: boolean;
  includeAccuracy: boolean;
}

export class LocationIntegrationService {
  /**
   * Generate a shareable Google Maps URL for the current location
   * This URL can be shared with emergency contacts
   */
  static generateGoogleMapsUrl(
    location: LocationSample,
    config: GoogleMapsConfig = {
      enableSharing: true,
      includeName: true,
      includeAccuracy: true,
    }
  ): string {
    const { lat, lng } = location;

    // Base Google Maps URL with coordinates
    let url = `https://maps.google.com/maps?q=${lat},${lng}`;

    // Add location name if enabled
    if (config.includeName) {
      const locationName = `Travel Buddy Safety Location`;
      url += `(${encodeURIComponent(locationName)})`;
    }

    // Add additional parameters for better user experience
    url += `&ll=${lat},${lng}`;
    url += `&z=15`; // Zoom level for good detail

    return url;
  }

  /**
   * Generate a more detailed shareable message with Google Maps URL
   * Suitable for SMS or messaging apps
   */
  static generateLocationShareMessage(
    location: LocationSample,
    tripName?: string,
    userName?: string
  ): string {
    const mapsUrl = this.generateGoogleMapsUrl(location);
    const timestamp = new Date(location.timestamp).toLocaleString();

    let message = `🚨 Travel Buddy Safety Alert\n\n`;

    if (userName) {
      message += `From: ${userName}\n`;
    }

    if (tripName) {
      message += `Trip: ${tripName}\n`;
    }

    message += `Time: ${timestamp}\n`;
    message += `Location: ${mapsUrl}\n\n`;
    message += `This is my current location. Please check on me if needed.`;

    return message;
  }
  /**
   * Save location sample to Supabase database (replaces local SQLite storage)
   * TODO: Implement Supabase integration
   */
  static async saveLocationToSupabase(
    location: LocationSample,
    sessionId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log("📍 Location will be saved to Supabase:", {
        locationId: location.id,
        sessionId,
        userId,
        coordinates: `${location.lat}, ${location.lng}`,
      }); // Use the new Supabase location service
      const { supabaseLocationService } = await import(
        "../supabase/location.service"
      );

      const savedLocation = await supabaseLocationService.saveLocation(
        location,
        sessionId,
        userId
      );

      if (savedLocation) {
        console.log(
          "✅ Location saved to Supabase successfully:",
          savedLocation.supabaseId
        );
      } else {
        throw new Error("Failed to save location to Supabase");
      }
    } catch (error) {
      console.error("❌ Failed to save location to Supabase:", error);
      // Don't throw - location tracking should continue even if save fails
    }
  }
  /**
   * Get recent location samples from Supabase with Google Maps URLs
   * TODO: Implement Supabase integration to replace local database
   */
  static async getLocationHistoryFromSupabase(
    sessionId: string,
    userId: string,
    limit?: number
  ): Promise<(LocationSample & { mapsUrl: string })[]> {
    try {
      console.log("📍 Fetching location history from Supabase:", {
        sessionId,
        userId,
        limit,
      }); // Use the new Supabase location service
      const { supabaseLocationService } = await import(
        "../supabase/location.service"
      );

      const locations = await supabaseLocationService.getLocationsBySession(
        sessionId,
        limit || 100
      );

      return locations.map((location) => ({
        ...location,
        mapsUrl: this.generateGoogleMapsUrl(location),
      }));
    } catch (error) {
      console.error("❌ Failed to get location history from Supabase:", error);
      return [];
    }
  }

  /**
   * Generate a trip summary with location points for sharing
   */
  static async generateTripLocationSummary(tripId: string): Promise<string> {
    try {
      // TODO: Replace with Supabase location fetching
      const locations = await this.getLocationHistoryFromSupabase(
        "session_id",
        "user_id",
        10
      );

      if (locations.length === 0) {
        return "No location data available for this trip.";
      }

      let summary = `🗺️ Trip Location Summary\n\n`;
      summary += `Total locations recorded: ${locations.length}\n\n`;

      // Add first and last locations
      if (locations.length > 0) {
        const first = locations[0];
        const last = locations[locations.length - 1];

        summary += `🟢 Start Location:\n${first.mapsUrl}\n\n`;

        if (locations.length > 1) {
          summary += `🔴 Current/End Location:\n${last.mapsUrl}\n\n`;
        }
      }

      // Add recent checkpoints if more than 2 locations
      if (locations.length > 2) {
        summary += `📍 Recent Checkpoints:\n`;
        const recentLocations = locations.slice(-5, -1); // Last 4 excluding the final one

        recentLocations.forEach((location: any, index: number) => {
          const time = new Date(location.timestamp).toLocaleTimeString();
          summary += `${index + 1}. ${time}: ${location.mapsUrl}\n`;
        });
      }

      return summary;
    } catch (error) {
      console.error("❌ Failed to generate trip summary:", error);
      return "Failed to generate location summary.";
    }
  }

  /**
   * Create an emergency alert message with current location
   */
  static generateEmergencyAlert(
    location: LocationSample,
    tripName?: string,
    userName?: string,
    customMessage?: string
  ): string {
    const mapsUrl = this.generateGoogleMapsUrl(location);
    const timestamp = new Date(location.timestamp).toLocaleString();

    let alert = `🆘 EMERGENCY ALERT - Travel Buddy\n\n`;

    if (userName) {
      alert += `Person: ${userName}\n`;
    }

    if (tripName) {
      alert += `Trip: ${tripName}\n`;
    }

    alert += `Time: ${timestamp}\n`;
    alert += `Emergency Location: ${mapsUrl}\n\n`;

    if (customMessage) {
      alert += `Message: ${customMessage}\n\n`;
    }

    alert += `⚠️ This is an emergency alert. Please respond immediately or contact emergency services.`;

    return alert;
  }

  /**
   * Validate location data quality
   */
  static validateLocationQuality(location: LocationSample): {
    isValid: boolean;
    quality: "excellent" | "good" | "fair" | "poor";
    warnings: string[];
  } {
    const warnings: string[] = [];
    let quality: "excellent" | "good" | "fair" | "poor" = "excellent";

    // Check accuracy
    if (location.accuracy > 100) {
      warnings.push("Low GPS accuracy (>100m)");
      quality = "poor";
    } else if (location.accuracy > 50) {
      warnings.push("Moderate GPS accuracy (>50m)");
      quality = quality === "excellent" ? "fair" : quality;
    } else if (location.accuracy > 20) {
      quality = quality === "excellent" ? "good" : quality;
    }

    // Check coordinates validity
    if (Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
      warnings.push("Invalid GPS coordinates");
      return { isValid: false, quality: "poor", warnings };
    }

    // Check if coordinates are zeros (often indicates GPS failure)
    if (location.lat === 0 && location.lng === 0) {
      warnings.push("GPS coordinates are zero (possible GPS failure)");
      return { isValid: false, quality: "poor", warnings };
    }

    // Check timestamp
    const now = Date.now();
    const locationAge = now - location.timestamp;
    if (locationAge > 5 * 60 * 1000) {
      // 5 minutes
      warnings.push("Location data is old (>5 minutes)");
      quality = quality === "excellent" ? "good" : quality;
    }

    return {
      isValid: true,
      quality,
      warnings,
    };
  }
}
