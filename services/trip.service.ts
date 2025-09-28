import { Trip, TripCreateInput } from "@/types/trip";
import { del, get, post, put, uploadFile } from "@/utils/http";

export class TripService {
  /**
   * Fetch all trips for the current user
   */
  static async getAllTrips(): Promise<Trip[]> {
    try {
      return await get<Trip[]>("trips");
    } catch (error) {
      console.error("Error fetching trips:", error);
      throw new Error("Failed to fetch trips");
    }
  }

  /**
   * Fetch a specific trip by ID
   */
  static async getTripById(id: string): Promise<Trip> {
    try {
      return await get<Trip>(`trips/${id}`);
    } catch (error) {
      console.error("Error fetching trip:", error);
      throw error;
    }
  }

  /**
   * Create a new trip
   */
  static async createTrip(tripData: TripCreateInput): Promise<Trip> {
    try {
      return await post<Trip>("trips", tripData);
    } catch (error) {
      console.error("Error creating trip:", error);
      throw error;
    }
  }

  /**
   * Update an existing trip
   */
  static async updateTrip(id: string, tripData: Partial<Trip>): Promise<Trip> {
    try {
      return await put<Trip>(`trips/${id}`, tripData);
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  }

  /**
   * Delete a trip
   */
  static async deleteTrip(id: string): Promise<void> {
    try {
      await del(`trips/${id}`);
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  }

  /**
   * Search trips by query
   */
  static async searchTrips(query: string): Promise<Trip[]> {
    try {
      return await get<Trip[]>(`trips/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error("Error searching trips:", error);
      throw new Error("Failed to search trips");
    }
  }

  /**
   * Get popular destinations
   */
  static async getPopularDestinations(): Promise<string[]> {
    try {
      return await get<string[]>("destinations/popular");
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
      throw new Error("Failed to fetch popular destinations");
    }
  }

  /**
   * Upload trip image
   */
  static async uploadTripImage(
    tripId: string,
    imageUri: string
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "trip-image.jpg",
      } as any);

      const response = await uploadFile<{ imageUrl: string }>(
        `trips/${tripId}/image`,
        formData
      );

      return response.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  }
}
