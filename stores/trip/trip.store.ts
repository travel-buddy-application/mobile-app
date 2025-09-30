// import { TripService } from "@/services/trip.service"; // TODO: Implement SQLite service
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
  updateTripStatus: (tripId: string, status: Trip["status"]) => void;
  addLocationToTrip: (location: LocationSample) => void;
  getLocationHistory: (tripId: string) => LocationSample[];
  fetchTrips: () => Promise<void>;
  clearLocationHistory: () => void;
  clearError: () => void;
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
            const newTrip: Trip = {
              id: Date.now().toString(),
              userId: "current-user", // TODO: Get from auth
              title: tripData.title,
              origin: tripData.origin,
              destination: tripData.destination,
              status: "active",
              startAt: new Date().toISOString(),
              contacts: tripData.contacts,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // TODO: Save to SQLite via TripService
            // const savedTrip = await TripService.createTrip(newTrip);

            const trips = [...get().trips, newTrip];
            set({
              trips,
              activeTrip: newTrip,
              isLoading: false,
            });

            return newTrip;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to start trip";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Fetch all trips
        fetchTrips: async () => {
          set({ isLoading: true, error: null });

          try {
            // TODO: Fetch from SQLite via TripService
            // const trips = await TripService.getAllTrips();
            const trips = get().trips; // Use existing for now

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

            if (!targetTripId) {
              throw new Error("No active trip to end");
            }

            const updatedTrips = trips.map((trip) => {
              if (trip.id === targetTripId) {
                return {
                  ...trip,
                  status: "ended" as const,
                  endAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
              }
              return trip;
            });

            // TODO: Update in SQLite via TripService
            // await TripService.updateTrip(targetTripId, { status: 'ended' });

            set({
              trips: updatedTrips,
              activeTrip: null,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to end trip";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Trigger SOS for active trip
        triggerSOS: async (tripId?: string) => {
          set({ isLoading: true, error: null });

          try {
            const { activeTrip, trips } = get();
            const targetTripId = tripId || activeTrip?.id;

            if (!targetTripId) {
              throw new Error("No active trip for SOS");
            }

            const updatedTrips = trips.map((trip) => {
              if (trip.id === targetTripId) {
                return {
                  ...trip,
                  status: "sos" as const,
                  updatedAt: new Date().toISOString(),
                };
              }
              return trip;
            });

            // TODO: Trigger SOS notifications via service
            // await SOSService.triggerEmergency(targetTripId);

            set({
              trips: updatedTrips,
              activeTrip:
                updatedTrips.find((t) => t.id === targetTripId) || null,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to trigger SOS";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Update trip status
        updateTripStatus: (tripId: string, status: Trip["status"]) => {
          const trips = get().trips.map((trip) => {
            if (trip.id === tripId) {
              return {
                ...trip,
                status,
                updatedAt: new Date().toISOString(),
              };
            }
            return trip;
          });

          const activeTrip = get().activeTrip;
          const updatedActiveTrip =
            activeTrip?.id === tripId
              ? trips.find((t) => t.id === tripId) || null
              : activeTrip;

          set({
            trips,
            activeTrip: updatedActiveTrip,
          });
        },

        // Add location sample to current trip
        addLocationToTrip: (location: LocationSample) => {
          const { activeTrip, locationHistory } = get();

          if (activeTrip) {
            const updatedLocation = {
              ...location,
              tripId: activeTrip.id,
            };

            set({
              locationHistory: [...locationHistory, updatedLocation],
            });

            // TODO: Save to SQLite
            // LocationService.addLocationSample(updatedLocation);
          }
        },

        // Get location history for a trip
        getLocationHistory: (tripId: string) => {
          return get().locationHistory.filter(
            (location) => location.tripId === tripId
          );
        },

        // Clear location history
        clearLocationHistory: () => {
          set({ locationHistory: [] });
        }, // Clear error
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: "trip-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          trips: state.trips,
          activeTrip: state.activeTrip,
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
    completedTrips: store.trips.filter((trip) => trip.status === "ended"),
    sosTrips: store.trips.filter((trip) => trip.status === "sos"),
    hasActiveTrip: !!store.activeTrip && store.activeTrip.status === "active",
  };
};
