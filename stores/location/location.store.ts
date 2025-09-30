import { LocationSample, LocationState } from "@/types/trip";
import * as Location from "expo-location";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface LocationStoreState extends LocationState {
  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  updateLocation: (location: LocationSample) => void;
  requestPermissions: () => Promise<boolean>;
  getCurrentPosition: () => Promise<LocationSample | null>;
  setServiceStatus: (status: LocationState["serviceStatus"]) => void;
  clearLocation: () => void;
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
      permissionStatus: "undetermined",

      // Start location tracking
      startTracking: async () => {
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
            (location) => {
              const locationSample: LocationSample = {
                id: Date.now().toString(),
                tripId: "", // Will be set by trip store
                timestamp: Date.now(),
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                speed: location.coords.speed || undefined,
                accuracy: location.coords.accuracy || 0,
                source: "gps",
                createdAt: new Date().toISOString(),
              };

              get().updateLocation(locationSample);
            }
          );

          set({ serviceStatus: "running" });

          // Store subscription for cleanup
          (get() as any).locationSubscription = subscription;
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
      },

      // Update current location
      updateLocation: (location: LocationSample) => {
        set({
          currentLocation: location,
          lastUpdate: Date.now(),
          accuracy: location.accuracy,
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
      },

      // Clear location data
      clearLocation: () => {
        set({
          currentLocation: null,
          lastUpdate: 0,
          accuracy: 0,
        });
      },
    }),
    { name: "location-store" }
  )
);
