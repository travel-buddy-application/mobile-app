import Constants from "expo-constants";
import * as Location from "expo-location";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Check if we're running in Expo Go (notifications won't work)
const isExpoGo = Constants.appOwnership === "expo";

export interface PermissionStatus {
  location: boolean;
  notifications: boolean;
  backgroundRefresh: boolean; // This would be handled differently in a real app
}

interface PermissionsState {
  // State
  permissions: PermissionStatus;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkPermissions: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  requestAllPermissions: () => Promise<PermissionStatus>;
  clearError: () => void;
}

export const usePermissionsStore = create<PermissionsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      permissions: {
        location: false,
        notifications: false,
        backgroundRefresh: false,
      },
      isLoading: false,
      error: null,

      // Check current permission status
      checkPermissions: async () => {
        set({ isLoading: true, error: null });

        try {
          // Check location permission
          const locationStatus = await Location.getForegroundPermissionsAsync();

          // Check notification permission (with Expo Go fallback)
          let notificationsGranted = false;
          if (!isExpoGo) {
            try {
              const Notifications = await import("expo-notifications");
              const notificationStatus =
                await Notifications.getPermissionsAsync();
              notificationsGranted = notificationStatus.status === "granted";
            } catch (err) {
              console.log("Notifications not available, using fallback:", err);
              notificationsGranted = false;
            }
          }

          set({
            permissions: {
              location: locationStatus.status === "granted",
              notifications: notificationsGranted,
              backgroundRefresh: false, // Would need platform-specific implementation
            },
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to check permissions";

          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      // Request location permission
      requestLocationPermission: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await Location.requestForegroundPermissionsAsync();
          const granted = result.status === "granted";

          set((state) => ({
            permissions: {
              ...state.permissions,
              location: granted,
            },
            isLoading: false,
          }));

          return granted;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to request location permission";

          set({
            error: errorMessage,
            isLoading: false,
          });

          return false;
        }
      },

      // Request notification permission
      requestNotificationPermission: async () => {
        set({ isLoading: true, error: null });

        try {
          // Handle Expo Go limitation
          if (isExpoGo) {
            console.log(
              "Notifications not supported in Expo Go - simulating granted"
            );
            set((state) => ({
              permissions: {
                ...state.permissions,
                notifications: true, // Simulate granted for demo purposes
              },
              isLoading: false,
            }));
            return true;
          }

          const Notifications = await import("expo-notifications");
          const result = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          const granted = result.status === "granted";

          set((state) => ({
            permissions: {
              ...state.permissions,
              notifications: granted,
            },
            isLoading: false,
          }));

          return granted;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to request notification permission";

          set({
            error: errorMessage,
            isLoading: false,
          });

          return false;
        }
      },

      // Request all permissions
      requestAllPermissions: async () => {
        set({ isLoading: true, error: null });

        try {
          const locationGranted = await get().requestLocationPermission();
          const notificationsGranted =
            await get().requestNotificationPermission();

          const finalPermissions = {
            location: locationGranted,
            notifications: notificationsGranted,
            backgroundRefresh: false, // Would need platform-specific implementation
          };

          set({
            permissions: finalPermissions,
            isLoading: false,
          });

          return finalPermissions;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to request permissions";

          set({
            error: errorMessage,
            isLoading: false,
          });

          throw error;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: "permissions-store" }
  )
);
