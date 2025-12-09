import { useLocationStore } from "@/stores";
import { calculateDistance } from "@/utils/calculate-location-distance";

export class StationaryDetectionService {
  private isMonitoring = false;
  private startTime: number | null = null;
  private referenceLocation: { lat: number; lng: number } | null = null;
  private onStationaryDetected: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;

  startMonitoring(onDetected: () => void) {
    this.onStationaryDetected = onDetected;
    this.isMonitoring = true;
    console.log("📍 Initializing stationary detection monitoring");

    // Start location tracking if not already started
    const locationStore = useLocationStore.getState();
    if (!locationStore.isTracking) {
      console.log("📍 Starting location tracking for stationary detection");
      locationStore.startTracking("stationary-detection");
    }

    // Subscribe to location changes
    this.unsubscribe = useLocationStore.subscribe((state) => {
      if (state.currentLocation) {
        this.updateLocation({
          lat: state.currentLocation.lat,
          lng: state.currentLocation.lng,
        });
      }
    });

    console.log("📍 Stationary detection monitoring started");
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.startTime = null;
    this.referenceLocation = null;

    // Unsubscribe
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    console.log("📍 Stationary detection monitoring stopped");
  }

  resetTimer() {
    this.startTime = Date.now();
    // Optionally update reference to current location, but for now, keep the same reference
  }

  private updateLocation(location: { lat: number; lng: number }) {
    console.log("📍 update location:", location);
    if (!this.isMonitoring) return;

    if (!this.referenceLocation) {
      this.referenceLocation = location;
      this.startTime = Date.now();
      console.log("📍 Stationary detection started at:", location);
      return;
    }

    const distance = calculateDistance(this.referenceLocation, location);

    if (distance > 20) {
      this.referenceLocation = location;
      this.startTime = Date.now();
    } else {
      const elapsed = Date.now() - (this.startTime || 0);
      const remaining = 5 * 60 * 1000 - elapsed; // 10 seconds for testing
      console.log(
        `📍 Stationary for ${(elapsed / 1000).toFixed(1)}s, remaining: ${(
          remaining / 1000
        ).toFixed(1)}s`
      );

      if (elapsed >= 5 * 60 * 1000) {
        // 10 seconds for testing
        console.log("📍 Stationary alert triggered!");
        this.onStationaryDetected?.();
        // Reset timer to prevent continuous triggering
        this.startTime = Date.now();
      }
    }
  }
}
