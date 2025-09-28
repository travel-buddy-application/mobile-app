import { TripService } from "@/services/trip.service";
import { Trip, TripCreateInput } from "@/types/trip";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface TripState {
  // State
  trips: Trip[];
  selectedTrip: Trip | null;
  favoriteTrips: Trip[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTrips: () => Promise<void>;
  fetchTripById: (id: string) => Promise<void>;
  createTrip: (tripData: TripCreateInput) => Promise<Trip>;
  updateTrip: (tripData: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  toggleFavorite: (tripId: string) => void;
  searchTrips: (query: string) => Promise<void>;
  setSelectedTrip: (trip: Trip | null) => void;
  clearError: () => void;
}

export const useTripStore = create<TripState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        trips: [],
        selectedTrip: null,
        favoriteTrips: [],
        isLoading: false,
        error: null,

        // Fetch all trips
        fetchTrips: async () => {
          set({ isLoading: true, error: null });
          try {
            const trips = await TripService.getAllTrips();
            const favoriteTrips = trips.filter((trip) => trip.isFavorite);
            set({
              trips,
              favoriteTrips,
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch trips",
              isLoading: false,
            });
          }
        },

        // Fetch trip by ID
        fetchTripById: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            const trip = await TripService.getTripById(id);
            set({
              selectedTrip: trip,
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error ? error.message : "Failed to fetch trip",
              isLoading: false,
            });
          }
        },

        // Create new trip
        createTrip: async (tripData: TripCreateInput) => {
          set({ isLoading: true, error: null });
          try {
            const newTrip = await TripService.createTrip(tripData);
            const { trips } = get();
            const updatedTrips = [...trips, newTrip];

            set({
              trips: updatedTrips,
              favoriteTrips: updatedTrips.filter((trip) => trip.isFavorite),
              isLoading: false,
            });

            return newTrip;
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create trip",
              isLoading: false,
            });
            throw error;
          }
        },

        // Update existing trip
        updateTrip: async (tripData: Trip) => {
          set({ isLoading: true, error: null });
          try {
            const updatedTrip = await TripService.updateTrip(
              tripData.id,
              tripData
            );
            const { trips } = get();
            const updatedTrips = trips.map((trip) =>
              trip.id === updatedTrip.id ? updatedTrip : trip
            );

            set({
              trips: updatedTrips,
              favoriteTrips: updatedTrips.filter((trip) => trip.isFavorite),
              selectedTrip: updatedTrip,
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to update trip",
              isLoading: false,
            });
          }
        },

        // Delete trip
        deleteTrip: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            await TripService.deleteTrip(id);
            const { trips } = get();
            const updatedTrips = trips.filter((trip) => trip.id !== id);

            set({
              trips: updatedTrips,
              favoriteTrips: updatedTrips.filter((trip) => trip.isFavorite),
              selectedTrip: null,
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to delete trip",
              isLoading: false,
            });
          }
        },

        // Toggle favorite status
        toggleFavorite: (tripId: string) => {
          const { trips } = get();
          const updatedTrips = trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, isFavorite: !trip.isFavorite }
              : trip
          );

          set({
            trips: updatedTrips,
            favoriteTrips: updatedTrips.filter((trip) => trip.isFavorite),
          });

          // Update on server
          const updatedTrip = updatedTrips.find((trip) => trip.id === tripId);
          if (updatedTrip) {
            TripService.updateTrip(tripId, updatedTrip).catch((error) => {
              console.error("Failed to update favorite status:", error);
              // Revert the change on error
              set({
                trips: trips,
                favoriteTrips: trips.filter((trip) => trip.isFavorite),
              });
            });
          }
        },

        // Search trips
        searchTrips: async (query: string) => {
          set({ isLoading: true, error: null });
          try {
            const trips = await TripService.searchTrips(query);
            set({
              trips,
              favoriteTrips: trips.filter((trip) => trip.isFavorite),
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to search trips",
              isLoading: false,
            });
          }
        },

        // Set selected trip
        setSelectedTrip: (trip: Trip | null) => {
          set({ selectedTrip: trip });
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: "trip-store",
        partialize: (state) => ({
          trips: state.trips,
          favoriteTrips: state.favoriteTrips,
        }),
      }
    ),
    {
      name: "trip-store",
    }
  )
);

// Computed selectors
export const useTripSelectors = () => {
  const store = useTripStore();

  return {
    ...store,
    upcomingTrips: store.trips.filter(
      (trip) => new Date(trip.startDate) > new Date()
    ),
    pastTrips: store.trips.filter(
      (trip) => new Date(trip.endDate) < new Date()
    ),
    currentTrips: store.trips.filter((trip) => {
      const now = new Date();
      return new Date(trip.startDate) <= now && new Date(trip.endDate) >= now;
    }),
  };
};
