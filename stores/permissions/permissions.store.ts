import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

const isExpoGo = Constants.appOwnership === "expo";

export interface PermissionStatus {
  location: boolean;
  notifications: boolean;
  backgroundRefresh: boolean;
}

interface PermissionsState {
  permissions: PermissionStatus;
  isLoading: boolean;
  error: string | null;

  checkPermissions: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  requestAllPermissions: () => Promise<PermissionStatus>;
  resetPermissions: () => Promise<void>;
  clearError: () => void;
}

export const usePermissionsStore = create<PermissionsState>()(
  devtools(
    persist(
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
            // Location
            const locationStatus =
              await Location.getForegroundPermissionsAsync();

            // Notifications
            let notificationsGranted = false;
            if (!isExpoGo) {
              try {
                const Notifications = await import("expo-notifications");
                const notificationStatus =
                  await Notifications.getPermissionsAsync();
                notificationsGranted = notificationStatus.status === "granted";
              } catch (err) {
                console.log("Notifications not available:", err);
              }
            }

            set({
              permissions: {
                location: locationStatus.status === "granted",
                notifications: notificationsGranted,
                backgroundRefresh: false,
              },
              isLoading: false,
            });
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to check permissions",
              isLoading: false,
            });
          }
        },

        // Request location
        requestLocationPermission: async () => {
          set({ isLoading: true, error: null });
          try {
            const result = await Location.requestForegroundPermissionsAsync();
            const granted = result.status === "granted";
            set((state) => ({
              permissions: { ...state.permissions, location: granted },
              isLoading: false,
            }));
            return granted;
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to request location permission",
              isLoading: false,
            });
            return false;
          }
        },

        // Request notifications
        requestNotificationPermission: async () => {
          set({ isLoading: true, error: null });
          try {
            if (isExpoGo) {
              console.log("Notifications not supported in Expo Go");
              set((state) => ({
                permissions: { ...state.permissions, notifications: false },
                isLoading: false,
              }));
              return false;
            }

            const Notifications = await import("expo-notifications");
            const result = await Notifications.requestPermissionsAsync({
              ios: { allowAlert: true, allowBadge: true, allowSound: true },
            });
            const granted = result.status === "granted";
            set((state) => ({
              permissions: { ...state.permissions, notifications: granted },
              isLoading: false,
            }));
            return granted;
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to request notification permission",
              isLoading: false,
            });
            return false;
          }
        },

        // Request all
        requestAllPermissions: async () => {
          set({ isLoading: true, error: null });
          try {
            const locationGranted = await get().requestLocationPermission();
            const notificationsGranted =
              await get().requestNotificationPermission();

            const finalPermissions = {
              location: locationGranted,
              notifications: notificationsGranted,
              backgroundRefresh: false,
            };

            set({ permissions: finalPermissions, isLoading: false });
            return finalPermissions;
          } catch (error) {
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to request permissions",
              isLoading: false,
            });
            throw error;
          }
        },

        // Reset permissions (clear state + storage)
        resetPermissions: async () => {
          set({
            permissions: {
              location: false,
              notifications: false,
              backgroundRefresh: false,
            },
            isLoading: false,
            error: null,
          });
        },

        // Clear error
        clearError: () => set({ error: null }),
      }),
      {
        name: "permissions-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          permissions: state.permissions,
        }),
      }
    ),
    { name: "permissions-store" }
  )
);
