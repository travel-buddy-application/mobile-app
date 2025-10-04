import { LocationIntegrationService } from "@/services/location/location-integration.service";
import { LocationSample, LocationState } from "@/types/trip";
import * as Location from "expo-location";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LocationStoreState extends LocationState {
  // Actions
  startTracking: (tripId?: string) => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: LocationSample, tripId?: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  getCurrentPosition: () => Promise<LocationSample | null>;
  setServiceStatus: (status: LocationState["serviceStatus"]) => void;
  clearLocation: () => void;

  // Google Maps integration
  generateShareableUrl: (location?: LocationSample) => string | null;
  generateLocationMessage: (
    tripName?: string,
    userName?: string
  ) => string | null;
  generateEmergencyAlert: (
    tripName?: string,
    userName?: string,
    customMessage?: string
  ) => string | null;
}

export const useLocationStore = create<LocationStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentLocation: null,
      isTracking: false,
      accuracy: 0,
      serviceStatus: "stopped",
      lastUpdate: 0,
      permissionStatus: "undetermined", // Start location tracking with optional trip association
      startTracking: async (tripId?: string) => {
        const { permissionStatus } = get();

        if (permissionStatus !== "granted") {
          const granted = await get().requestPermissions();
          if (!granted) return;
        }

        set({
          serviceStatus: "starting",
          isTracking: true,
        });

        try {
          // Start watching position
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 10000, // 10 seconds
              distanceInterval: 5, // 5 meters
            },
            async (location) => {
              const locationSample: LocationSample = {
                id: Date.now().toString(),
                tripId: tripId || "",
                timestamp: Date.now(),
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                speed: location.coords.speed || undefined,
                accuracy: location.coords.accuracy || 0,
                source: "gps",
                createdAt: new Date().toISOString(),
              };

              // Update location and save to database if trip is associated
              await get().updateLocation(locationSample, tripId);
            }
          );

          set({ serviceStatus: "running" });

          // Store subscription for cleanup
          (get() as any).locationSubscription = subscription;

          console.log(
            "📍 Location tracking started",
            tripId ? `for trip: ${tripId}` : ""
          );
        } catch (error) {
          console.error("Failed to start location tracking:", error);
          set({
            serviceStatus: "error",
            isTracking: false,
          });
        }
      },

      // Stop location tracking
      stopTracking: () => {
        const subscription = (get() as any).locationSubscription;
        if (subscription) {
          subscription.remove();
        }

        set({
          serviceStatus: "stopped",
          isTracking: false,
          currentLocation: null,
        });
      }, // Update current location and optionally save to database
      updateLocation: async (location: LocationSample, tripId?: string) => {
        // Validate location quality
        const validation =
          LocationIntegrationService.validateLocationQuality(location);

        if (!validation.isValid) {
          console.warn("⚠️ Invalid location data:", validation.warnings);
          return;
        }

        if (validation.warnings.length > 0) {
          console.warn("⚠️ Location quality issues:", validation.warnings);
        }

        // Update local state
        set({
          currentLocation: location,
          lastUpdate: Date.now(),
          accuracy: location.accuracy,
        });

        // Save to database if trip ID is provided
        if (tripId || location.tripId) {
          await LocationIntegrationService.saveLocationSample(location, tripId);
        }

        console.log(`📍 Location updated (${validation.quality} quality):`, {
          lat: location.lat.toFixed(6),
          lng: location.lng.toFixed(6),
          accuracy: `${location.accuracy}m`,
        });
      },

      // Request location permissions
      requestPermissions: async () => {
        try {
          const { status: foregroundStatus } =
            await Location.requestForegroundPermissionsAsync();

          if (foregroundStatus === "granted") {
            const { status: backgroundStatus } =
              await Location.requestBackgroundPermissionsAsync();

            const granted =
              foregroundStatus === "granted" && backgroundStatus === "granted";
            set({
              permissionStatus: granted ? "granted" : "denied",
            });

            return granted;
          }

          set({ permissionStatus: "denied" });
          return false;
        } catch (error) {
          console.error("Permission request failed:", error);
          set({ permissionStatus: "denied" });
          return false;
        }
      },

      // Get current position once
      getCurrentPosition: async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const locationSample: LocationSample = {
            id: Date.now().toString(),
            tripId: "",
            timestamp: Date.now(),
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            speed: location.coords.speed || undefined,
            accuracy: location.coords.accuracy || 0,
            source: "gps",
            createdAt: new Date().toISOString(),
          };

          return locationSample;
        } catch (error) {
          console.error("Failed to get current position:", error);
          return null;
        }
      },

      // Set service status
      setServiceStatus: (status: LocationState["serviceStatus"]) => {
        set({ serviceStatus: status });
      }, // Clear location data
      clearLocation: () => {
        set({
          currentLocation: null,
          lastUpdate: 0,
          accuracy: 0,
        });
      },

      // Generate shareable Google Maps URL for current location
      generateShareableUrl: (location?: LocationSample) => {
        const targetLocation = location || get().currentLocation;
        if (!targetLocation) return null;

        return LocationIntegrationService.generateGoogleMapsUrl(targetLocation);
      },

      // Generate location share message
      generateLocationMessage: (tripName?: string, userName?: string) => {
        const { currentLocation } = get();
        if (!currentLocation) return null;

        return LocationIntegrationService.generateLocationShareMessage(
          currentLocation,
          tripName,
          userName
        );
      },

      // Generate emergency alert message
      generateEmergencyAlert: (
        tripName?: string,
        userName?: string,
        customMessage?: string
      ) => {
        const { currentLocation } = get();
        if (!currentLocation) return null;

        return LocationIntegrationService.generateEmergencyAlert(
          currentLocation,
          tripName,
          userName,
          customMessage
        );
      },
    }),
    { name: "location-store" }
  )
);
