import { TripDatabaseService } from "@/services/database/trip.service";
import {
  periodicLocationSharingService,
  PeriodicLocationSharingService,
} from "@/services/location/periodic-location-sharing.service";

import { useLocationStore } from "@/stores/location/location.store";
import { LocationSample, Trip, TripCreateInput } from "@/types/trip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface TripState {
  trips: Trip[];
  activeTrip: Trip | null;
  locationHistory: LocationSample[];
  isLoading: boolean;
  error: string | null;

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

  isPeriodicSharingActive: () => boolean;
}

export const useTripStore = create<TripState>()(
  devtools(
    persist(
      (set, get) => ({
        trips: [],
        activeTrip: null,
        locationHistory: [],
        isLoading: false,
        error: null, 
        startTrip: async (tripData: TripCreateInput) => {
          set({ isLoading: true, error: null });

          try {
            const newTrip = await TripDatabaseService.createTrip(tripData);

            const trips = [...get().trips, newTrip];
            set({
              trips,
              activeTrip: newTrip,
              isLoading: false,
            }); 
            try {
              const { locationSessionManager } = await import(
                "@/services/location/session-manager.service"
              );

              const session = await locationSessionManager.startSession(
                newTrip.id,
                newTrip.title
              );

              console.log("📍 Location session started for trip:", {
                tripId: newTrip.id,
                sessionId: session.sessionId,
              });

              await periodicLocationSharingService.sendTripStartedWithSession(
                newTrip,
                session.sessionId,
                session.userId
              );

            } catch (locationError) {
              console.warn(
                "⚠️ Failed to start location session:",
                locationError
              );
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
        }, 
        fetchTrips: async () => {
          set({ isLoading: true, error: null });

          try {
            const trips = await TripDatabaseService.getAllTrips();

            set({
              trips,
              isLoading: false,
            });

          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to fetch trips";
            set({
              error: errorMessage,
              isLoading: false,
            });
          }
        }, // End the active trip
        endTrip: async (tripId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const { activeTrip, trips } = get();
            const targetTripId = tripId || activeTrip?.id;
            console.log("🚀 Ending trip:", targetTripId);

            if (!targetTripId) {
              throw new Error("No active trip to end");
            } 
            const updatedTrip = await TripDatabaseService.updateTrip(
              targetTripId,
              {
                status: "completed",
                endAt: new Date().toISOString(),
              }
            );

            const updatedTrips = trips.map((trip) =>
              trip.id === targetTripId ? updatedTrip : trip
            );
            set({
              trips: updatedTrips,
              activeTrip: null,
              isLoading: false,
            }); 
            try {
              const { locationSessionManager } = await import(
                "@/services/location/session-manager.service"
              );
              const currentSession =
                await locationSessionManager.getCurrentSession();

              if (currentSession) {
                try {
                  await periodicLocationSharingService.sendTripEndedWithSession(
                    updatedTrip,
                    currentSession.sessionId,
                    currentSession.userId
                  );
                } catch (notificationError) {
                  console.warn(
                    "⚠️ Failed to send trip ended notification:",
                    notificationError
                  );
                }
              }

              await locationSessionManager.stopSession();
              periodicLocationSharingService.stopPeriodicSharing();
            } catch (error) {
              console.warn("⚠️ Failed to stop location session:", error);
            }

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
        }, 
        triggerSOS: async (tripId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const { activeTrip, trips } = get();
            const targetTripId = tripId || activeTrip?.id;

            if (!targetTripId) {
              throw new Error("No active trip for SOS");
            } 
            const updatedTrip = await TripDatabaseService.updateTrip(
              targetTripId,
              {
                status: "emergency",
              }
            );

            const updatedTrips = trips.map((trip) =>
              trip.id === targetTripId ? updatedTrip : trip
            );

            set({
              trips: updatedTrips,
              activeTrip:
                updatedTrips.find((t) => t.id === targetTripId) || null,
              isLoading: false,
            }); 
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
        }, 
        updateTripStatus: async (tripId: string, status: Trip["status"]) => {
          try {
            const updatedTrip = await TripDatabaseService.updateTrip(tripId, {
              status,
            });

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
        }, 
        addLocationToTrip: async (location: LocationSample) => {
          const { activeTrip, locationHistory } = get();

          if (activeTrip) {
            const updatedLocation = {
              ...location,
              tripId: activeTrip.id,
            };
            try {
              set({
                locationHistory: [...locationHistory, updatedLocation],
              });
            } catch (error) {
              console.error("❌ Failed to process location for trip:", error);
            }
          }
        },

        getLocationHistory: async (tripId: string) => {
          console.warn(
            "⚠️ getLocationHistory is deprecated - locations are now in Supabase"
          );
          const locationHistory = get().locationHistory.filter(
            (location) => location.tripId === tripId
          );
          return locationHistory;
        }, // Clear location history
        clearLocationHistory: async (tripId?: string) => {
          console.warn(
            "⚠️ clearLocationHistory is deprecated - locations are now in Supabase"
          );
          if (tripId) {
            const filteredHistory = get().locationHistory.filter(
              (location) => location.tripId !== tripId
            );
            set({ locationHistory: filteredHistory });
          } else {
            set({ locationHistory: [] });
            console.log("🧹 All location history cleared from local state");
          }
        }, // Clear error
        clearError: () => {
          set({ error: null });
        },

        initializeFromDatabase: async () => {
          try {
            console.log("🔄 Initializing trip store from database...");

            const trips = await TripDatabaseService.getAllTrips();

            const activeTrip =
              trips.find((trip) => trip.status === "active") || null; // Note: Location history loading from SQLite removed
            let locationHistory: LocationSample[] = [];

            set({
              trips,
              activeTrip,
              locationHistory,
              isLoading: false,
              error: null,
            });

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

        isPeriodicSharingActive: () => {
          return periodicLocationSharingService.isPeriodicSharingActive();
        },
      }),
      {
        name: "trip-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          activeTrip: state.activeTrip,
          error: state.error,
        }),
      }
    ),
    { name: "trip-store" }
  )
);

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
