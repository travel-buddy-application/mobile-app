import { PeriodicLocationSharingService } from '@/services/location/periodic-location-sharing.service';
import { TripLocationIntegrationService } from '@/services/location/trip-location-integration.service';
import { useTripStore, useLocationStore } from '@/stores';

export async function sendEmergencySOS() {
  const tripStore = useTripStore.getState();
  const locationStore = useLocationStore.getState();

  const activeTrip = tripStore.activeTrip;
  if (!activeTrip) throw new Error('No active trip');

  let currentLocation = locationStore.currentLocation;
  if (!currentLocation) {
    currentLocation = await locationStore.getCurrentPosition();
    if (!currentLocation) throw new Error('No current location');
  }

  const pushResult = await PeriodicLocationSharingService.sendManualEmergencyAlert(
    activeTrip,
    currentLocation,
    '🆘 EMERGENCY SOS: I need immediate help!'
  );

  const emailResult = await TripLocationIntegrationService.sendEmergencyAlert(
    'Emergency Contact',
    '🆘 EMERGENCY SOS: I need immediate help! This is my current location.'
  );

  return { pushResult, emailResult };
}

export default { sendEmergencySOS };
