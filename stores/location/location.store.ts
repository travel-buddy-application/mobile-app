import { LocationIntegrationService } from "@/services/location/location-integration.service";
import { LocationSample, LocationState } from "@/types/trip";
import * as Location from "expo-location";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LocationStoreState extends LocationState {
  startTracking: (tripId?: string) => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: LocationSample, tripId?: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  getCurrentPosition: () => Promise<LocationSample | null>;
  setServiceStatus: (status: LocationState["serviceStatus"]) => void;
  clearLocation: () => void;

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
      currentLocation: null,
      isTracking: false,
      accuracy: 0,
      serviceStatus: "stopped",
      lastUpdate: 0,
      permissionStatus: "undetermined",
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

              await get().updateLocation(locationSample, tripId);
            }
          );

          set({ serviceStatus: "running" });

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
      }, 
      updateLocation: async (location: LocationSample, tripId?: string) => {
        const validation =
          LocationIntegrationService.validateLocationQuality(location);

        if (!validation.isValid) {
          console.warn("⚠️ Invalid location data:", validation.warnings);
          return;
        }

        if (validation.warnings.length > 0) {
          console.warn("⚠️ Location quality issues:", validation.warnings);
        } 
        set({
          currentLocation: location,
          lastUpdate: Date.now(),
          accuracy: location.accuracy,
        });

        if (tripId || location.tripId) {
          try {
            const { locationSessionManager } = await import(
              "@/services/location/session-manager.service"
            );
            const { LocationIntegrationService } = await import(
              "@/services/location/location-integration.service"
            );

            const sessionData =
              locationSessionManager.getSessionNotificationData();

            if (sessionData) {
              await LocationIntegrationService.saveLocationToSupabase(
                location,
                sessionData.sessionId,
                sessionData.userId
              );
            } else {
              console.warn("⚠️ No active session for location saving");
            }
          } catch (error) {
            console.warn("⚠️ Failed to save location to Supabase:", error);
          }
        }
      },

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

      setServiceStatus: (status: LocationState["serviceStatus"]) => {
        set({ serviceStatus: status });
      }, 
      clearLocation: () => {
        set({
          currentLocation: null,
          lastUpdate: 0,
          accuracy: 0,
        });
      },

      generateShareableUrl: (location?: LocationSample) => {
        const targetLocation = location || get().currentLocation;
        if (!targetLocation) return null;

        return LocationIntegrationService.generateGoogleMapsUrl(targetLocation);
      },

      generateLocationMessage: (tripName?: string, userName?: string) => {
        const { currentLocation } = get();
        if (!currentLocation) return null;

        return LocationIntegrationService.generateLocationShareMessage(
          currentLocation,
          tripName,
          userName
        );
      },

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
