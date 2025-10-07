import { TripDatabaseService } from "@/services/database/trip.service";
import {
  periodicLocationSharingService,
  PeriodicLocationSharingService,
} from "@/services/location/periodic-location-sharing.service";
import { TripCompletionNotificationService } from "@/services/trip-completion-notifications.service";
import { useLocationStore } from "@/stores/location/location.store";
import { LocationSample, Trip, TripCreateInput } from "@/types/trip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface TripState {
  // State
  trips: Trip[];
  activeTrip: Trip | null;
  locationHistory: LocationSample[];
  isLoading: boolean;
  error: string | null;

  // Actions
  startTrip: (tripData: TripCreateInput) => Promise<Trip>;
  endTrip: (tripId?: string) => Promise<void>;
  triggerSOS: (tripId?: string) => Promise<void>;
  updateTripStatus: (tripId: string, status: Trip["status"]) => Promise<void>;
  addLocationToTrip: (location: LocationSample) => Promise<void>;
  getLocationHistory: (tripId: string) => Promise<LocationSample[]>;
  fetchTrips: () => Promise<void>;
  clearLocationHistory: (tripId?: string) => Promise<void>;
  clearError: () => void;
  initializeFromDatabase: () => Promise<void>;

  // Periodic location sharing
  isPeriodicSharingActive: () => boolean;
}

export const useTripStore = create<TripState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trips: [],
        activeTrip: null,
        locationHistory: [],
        isLoading: false,
        error: null, // Start a new safety trip
        startTrip: async (tripData: TripCreateInput) => {
          set({ isLoading: true, error: null });

          try {
            // Create trip using SQLite database service
            const newTrip = await TripDatabaseService.createTrip(tripData);

            // Update local state
            const trips = [...get().trips, newTrip];
            set({
              trips,
              activeTrip: newTrip,
              isLoading: false,
            });

            // Start periodic location sharing via push notifications
            try {
              await periodicLocationSharingService.startPeriodicSharing(
                newTrip
              );
              console.log(
                "📍 Automatic location sharing started for trip:",
                newTrip.id
              );
            } catch (locationError) {
              console.warn(
                "⚠️ Failed to start periodic location sharing:",
                locationError
              );
              // Don't fail the trip creation if location sharing fails
            }

            console.log("🚀 Trip started successfully:", newTrip.id);
            return newTrip;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to start trip";
            set({
              error: errorMessage,
              isLoading: false,
            });
            console.error("❌ Failed to start trip:", error);
            throw error;
          }
        }, // Fetch all trips
        fetchTrips: async () => {
          set({ isLoading: true, error: null });

          try {
            // Fetch trips from SQLite database
            const trips = await TripDatabaseService.getAllTrips();

            set({
              trips,
              isLoading: false,
            });

            console.log(`📋 Fetched ${trips.length} trips from database`);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to fetch trips";
            set({
              error: errorMessage,
              isLoading: false,
            });
            console.error("❌ Failed to fetch trips:", error);
          }
        }, // End the active trip
        endTrip: async (tripId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const { activeTrip, trips } = get();
            const targetTripId = tripId || activeTrip?.id;

            if (!targetTripId) {
              throw new Error("No active trip to end");
            } // Update trip in SQLite database
            const updatedTrip = await TripDatabaseService.updateTrip(
              targetTripId,
              {
                status: "completed",
                endAt: new Date().toISOString(),
              }
            );

            // Update local state
            const updatedTrips = trips.map((trip) =>
              trip.id === targetTripId ? updatedTrip : trip
            );
            set({
              trips: updatedTrips,
              activeTrip: null,
              isLoading: false,
            }); // Stop periodic location sharing
            periodicLocationSharingService.stopPeriodicSharing();
            console.log("📍 Periodic location sharing stopped"); // Send trip completion notifications to emergency contacts
            try {
              console.log(
                "🔍 Debug: Trip completion - checking contacts data:"
              );
              console.log("- Trip ID:", updatedTrip.id);
              console.log("- Trip contacts array:", updatedTrip.contacts);
              console.log(
                "- Trip contacts length:",
                updatedTrip.contacts?.length || 0
              );

              const notificationResult =
                await TripCompletionNotificationService.sendTripCompletionNotifications(
                  updatedTrip
                );
              if (notificationResult.success) {
                console.log(
                  `🔔 Trip completion notifications sent: ${notificationResult.message}`
                );
              } else {
                console.warn(
                  `⚠️ Trip completion notifications failed: ${notificationResult.message}`
                );
              }
            } catch (notificationError) {
              console.error(
                "❌ Failed to send trip completion notifications:",
                notificationError
              );
              // Don't fail the trip completion if notifications fail
            }

            console.log("🏁 Trip ended successfully:", targetTripId);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to end trip";
            set({
              error: errorMessage,
              isLoading: false,
            });
            console.error("❌ Failed to end trip:", error);
            throw error;
          }
        }, // Trigger SOS for active trip
        triggerSOS: async (tripId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const { activeTrip, trips } = get();
            const targetTripId = tripId || activeTrip?.id;

            if (!targetTripId) {
              throw new Error("No active trip for SOS");
            } // Update trip status to SOS in SQLite database
            const updatedTrip = await TripDatabaseService.updateTrip(
              targetTripId,
              {
                status: "emergency",
              }
            );

            // Update local state
            const updatedTrips = trips.map((trip) =>
              trip.id === targetTripId ? updatedTrip : trip
            );

            set({
              trips: updatedTrips,
              activeTrip:
                updatedTrips.find((t) => t.id === targetTripId) || null,
              isLoading: false,
            }); // Send emergency notifications via periodic location sharing service
            try {
              const locationStore = useLocationStore.getState();
              if (locationStore.currentLocation) {
                const result =
                  await PeriodicLocationSharingService.sendManualEmergencyAlert(
                    updatedTrip,
                    locationStore.currentLocation,
                    "🚨 SOS EMERGENCY: Help needed immediately!"
                  );

                if (result.success) {
                  console.log(
                    `🚨 Emergency notifications sent to ${result.sentCount} contacts`
                  );
                } else {
                  console.warn(
                    "⚠️ No emergency contacts available for SOS alerts"
                  );
                }
              } else {
                console.warn("⚠️ No location available for SOS alert");
              }
            } catch (notificationError) {
              console.error(
                "❌ Failed to send SOS notifications:",
                notificationError
              );
              // Don't fail the SOS trigger if notifications fail
            }

            console.log("🆘 SOS triggered successfully:", targetTripId);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to trigger SOS";
            set({
              error: errorMessage,
              isLoading: false,
            });
            console.error("❌ Failed to trigger SOS:", error);
            throw error;
          }
        }, // Update trip status
        updateTripStatus: async (tripId: string, status: Trip["status"]) => {
          try {
            // Update trip in SQLite database
            const updatedTrip = await TripDatabaseService.updateTrip(tripId, {
              status,
            });

            // Update local state
            const trips = get().trips.map((trip) =>
              trip.id === tripId ? updatedTrip : trip
            );

            const activeTrip = get().activeTrip;
            const updatedActiveTrip =
              activeTrip?.id === tripId ? updatedTrip : activeTrip;

            set({
              trips,
              activeTrip: updatedActiveTrip,
            });

            console.log("📝 Trip status updated:", tripId, status);
          } catch (error) {
            console.error("❌ Failed to update trip status:", error);
            throw error;
          }
        }, // Add location sample to current trip
        addLocationToTrip: async (location: LocationSample) => {
          const { activeTrip, locationHistory } = get();

          if (activeTrip) {
            const updatedLocation = {
              ...location,
              tripId: activeTrip.id,
            };

            try {
              // Save to SQLite database
              await TripDatabaseService.addLocationSample(updatedLocation);

              // Update local state
              set({
                locationHistory: [...locationHistory, updatedLocation],
              });

              console.log("📍 Location added to trip:", updatedLocation.id);
            } catch (error) {
              console.error("❌ Failed to add location to trip:", error);
              // Don't throw error to avoid breaking location tracking
            }
          }
        }, // Get location history for a trip
        getLocationHistory: async (tripId: string) => {
          try {
            // Fetch from SQLite database
            const locationHistory =
              await TripDatabaseService.getLocationHistory(tripId);

            // Update local state with fetched data
            set({ locationHistory });

            console.log(
              `📍 Loaded ${locationHistory.length} location samples for trip:`,
              tripId
            );
            return locationHistory;
          } catch (error) {
            console.error("❌ Failed to get location history:", error);
            // Fallback to local state
            return get().locationHistory.filter(
              (location) => location.tripId === tripId
            );
          }
        }, // Clear location history
        clearLocationHistory: async (tripId?: string) => {
          try {
            if (tripId) {
              // Clear location history for specific trip in SQLite
              await TripDatabaseService.clearLocationHistory(tripId);

              // Update local state - remove locations for this trip
              const filteredHistory = get().locationHistory.filter(
                (location) => location.tripId !== tripId
              );
              set({ locationHistory: filteredHistory });

              console.log("🧹 Location history cleared for trip:", tripId);
            } else {
              // Clear all location history
              set({ locationHistory: [] });
              console.log("🧹 All location history cleared from local state");
            }
          } catch (error) {
            console.error("❌ Failed to clear location history:", error);
            // Fallback to local clear
            set({ locationHistory: [] });
          }
        }, // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Initialize store with data from SQLite database
        initializeFromDatabase: async () => {
          try {
            console.log("🔄 Initializing trip store from database...");

            // Load all trips from database
            const trips = await TripDatabaseService.getAllTrips();

            // Find active trip
            const activeTrip =
              trips.find((trip) => trip.status === "active") || null;

            // Load location history for active trip
            let locationHistory: LocationSample[] = [];
            if (activeTrip) {
              locationHistory = await TripDatabaseService.getLocationHistory(
                activeTrip.id
              );
            }

            // Update store state
            set({
              trips,
              activeTrip,
              locationHistory,
              isLoading: false,
              error: null,
            });

            console.log(
              `✅ Trip store initialized: ${trips.length} trips, active: ${
                activeTrip?.id || "none"
              }`
            );
          } catch (error) {
            console.error(
              "❌ Failed to initialize trip store from database:",
              error
            );
            set({
              error: "Failed to load trip data from database",
              isLoading: false,
            });
          }
        },

        // Check if periodic location sharing is active
        isPeriodicSharingActive: () => {
          return periodicLocationSharingService.isPeriodicSharingActive();
        },
      }),
      {
        name: "trip-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Only persist minimal state - trips are in SQLite
          activeTrip: state.activeTrip, // Keep active trip for quick access
          error: state.error,
        }),
      }
    ),
    { name: "trip-store" }
  )
);

// Computed selectors for safety app
export const useTripSelectors = () => {
  const store = useTripStore();

  return {
    ...store,
    activeTrips: store.trips.filter((trip) => trip.status === "active"),
    completedTrips: store.trips.filter((trip) => trip.status === "completed"),
    sosTrips: store.trips.filter((trip) => trip.status === "emergency"),
    hasActiveTrip: !!store.activeTrip && store.activeTrip.status === "active",
  };
};
