// Import hooks for combined use
import { useAuthStore } from "./auth/auth.store";
import { useContactStore } from "./contact/contact.store";
import { useLocationStore } from "./location/location.store";
import { usePermissionsStore } from "./permissions/permissions.store";
import { useRiskStore } from "./risk/risk.store";
import { useTripStore } from "./trip/trip.store";

// Store exports for easy imports
export { useAuthStore } from "./auth/auth.store";
export { useContactStore } from "./contact/contact.store";
export { useLocationStore } from "./location/location.store";
export { usePermissionsStore } from "./permissions/permissions.store";
export { useRiskStore } from "./risk/risk.store";
export { useTripSelectors, useTripStore } from "./trip/trip.store";

// Combined hook for accessing all stores
export const useStores = () => ({
  auth: useAuthStore(),
  trip: useTripStore(),
  location: useLocationStore(),
  permissions: usePermissionsStore(),
  risk: useRiskStore(),
  contact: useContactStore(),
});
