import { TripLocationIntegrationService } from '@/services/location/trip-location-integration.service';
import { useLocationStore } from '@/stores';

export async function startTripWithContacts(contactIds: string[]) {
  const locationStore = useLocationStore.getState();
  const currentLocation = (await locationStore.getCurrentPosition()) ?? { lat: 40.7128, lng: -74.006, accuracy: 100, timestamp: Date.now() } as any;

  await TripLocationIntegrationService.startTripWithLocationTracking({
    title: 'Safe Trip',
    origin: { lat: currentLocation.lat, lng: currentLocation.lng, address: 'Current Location' },
    destination: { lat: currentLocation.lat + 0.01, lng: currentLocation.lng + 0.01, address: 'Destination' },
    contacts: contactIds,
  });
}

export async function endTrip() {
  await TripLocationIntegrationService.endTripAndStopTracking();
}

export default { startTripWithContacts, endTrip };
