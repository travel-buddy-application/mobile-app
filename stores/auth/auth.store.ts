import { fcmService } from "@/services/fcm.service";
import {
  EmergencyContact,
  OnboardingSteps,
  User,
  UserCreateInput,
} from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
interface AuthState {
  // State
  user: User | null;
  isOnboarded: boolean;
  currentOnboardingStep: OnboardingSteps;
  completedSteps: OnboardingSteps[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createUserProfile: (userData: UserCreateInput) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  addEmergencyContact: (contact: EmergencyContact) => Promise<void>;
  removeEmergencyContact: (contactId: string) => Promise<void>;
  completeOnboardingStep: (step: OnboardingSteps) => void;
  setOnboardingStep: (step: OnboardingSteps) => void;
  completeOnboarding: () => void;
  loadUserFromStorage: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;

  // Debug helpers
  resetOnboarding: () => void;
  getOnboardingStatus: () => {
    isOnboarded: boolean;
    currentOnboardingStep: OnboardingSteps;
    completedSteps: OnboardingSteps[];
    hasUser: boolean;
  };
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isOnboarded: false,
        currentOnboardingStep: "profile",
        completedSteps: [],
        isLoading: false,
        error: null,

        // Create user profile (Step 1 of onboarding)
        createUserProfile: async (userData: UserCreateInput) => {
          set({ isLoading: true, error: null });

          try {
            // Initialize FCM service if not already done
            await fcmService.initialize();

            // Get FCM token for push notifications
            const fcmToken = await fcmService.getToken();

            if (!fcmToken) {
              throw new Error(
                "Failed to get FCM token, Check your internet connection, cannot proceed with profile creation"
              );
            }
            const newUser: User = {
              id: Date.now().toString(),
              name: userData.name.trim(),
              phone: userData.phone.trim(),
              email: userData.email?.trim(),
              fcmToken: fcmToken || "",
              emergencyContacts: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Save to secure storage
            await SecureStore.setItemAsync(
              "user_profile",
              JSON.stringify(newUser)
            );

            set({
              user: newUser,
              isLoading: false,
            });

            // Complete profile step and move to contacts
            get().completeOnboardingStep("profile");
            get().setOnboardingStep("contacts");
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to create profile";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Update existing user profile
        updateUserProfile: async (updates: Partial<User>) => {
          set({ isLoading: true, error: null });

          try {
            const { user } = get();
            if (!user) {
              throw new Error("No user to update");
            }

            const updatedUser: User = {
              ...user,
              ...updates,
              updatedAt: new Date().toISOString(),
            };

            // Save to secure storage
            await SecureStore.setItemAsync(
              "user_profile",
              JSON.stringify(updatedUser)
            );

            set({
              user: updatedUser,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to update profile";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Add emergency contact
        addEmergencyContact: async (contact: EmergencyContact) => {
          set({ isLoading: true, error: null });

          try {
            const { user } = get();
            if (!user) {
              throw new Error("No user profile found");
            }

            const updatedContacts = [...user.emergencyContacts, contact];
            await get().updateUserProfile({
              emergencyContacts: updatedContacts,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to add emergency contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Remove emergency contact
        removeEmergencyContact: async (contactId: string) => {
          set({ isLoading: true, error: null });

          try {
            const { user } = get();
            if (!user) {
              throw new Error("No user profile found");
            }

            const updatedContacts = user.emergencyContacts.filter(
              (contact) => contact.id !== contactId
            );
            await get().updateUserProfile({
              emergencyContacts: updatedContacts,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to remove emergency contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Complete an onboarding step
        completeOnboardingStep: (step: OnboardingSteps) => {
          const { completedSteps } = get();
          if (!completedSteps.includes(step)) {
            set({
              completedSteps: [...completedSteps, step],
            });
          }
        },

        // Set current onboarding step
        setOnboardingStep: (step: OnboardingSteps) => {
          set({ currentOnboardingStep: step });
        },

        // Complete entire onboarding process
        completeOnboarding: () => {
          set({
            isOnboarded: true,
            currentOnboardingStep: "completed",
          });
        }, // Load user from secure storage
        loadUserFromStorage: async () => {
          set({ isLoading: true, error: null });

          try {
            const userJson = await SecureStore.getItemAsync("user_profile");

            if (userJson && userJson.trim() !== "") {
              const user: User = JSON.parse(userJson);
              set({
                user,
                isOnboarded: true, // If user exists, they've completed onboarding
                currentOnboardingStep: "completed",
                completedSteps: ["profile", "contacts", "permissions"],
                isLoading: false,
              });
            } else {
              // No user found or empty storage - reset to initial state
              set({
                user: null,
                isOnboarded: false,
                currentOnboardingStep: "profile",
                completedSteps: [],
                isLoading: false,
              });
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to load user profile";
            set({
              error: errorMessage,
              isLoading: false,
            });
          }
        }, // Logout and clear user data
        logout: async () => {
          set({ isLoading: true, error: null });

          try {
            // Clear user profile from SecureStore
            await SecureStore.deleteItemAsync("user_profile");

            // Clear contacts from contact store
            try {
              const { useContactStore } = await import(
                "../contact/contact.store"
              );
              await useContactStore.getState().clearAllContacts();
            } catch (err) {
              console.warn("Failed to clear contacts during logout:", err);
            }
            try {
              const { usePermissionsStore } = await import(
                "../permissions/permissions.store"
              );
              await usePermissionsStore.getState().resetPermissions();
            } catch (err) {
              console.warn("Failed to reset permissions during logout:", err);
            }

            set({
              user: null,
              isOnboarded: false,
              currentOnboardingStep: "profile",
              completedSteps: [],
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to logout";
            set({
              error: errorMessage,
              isLoading: false,
            });
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Debug helpers for development/testing
        resetOnboarding: () => {
          set({
            isOnboarded: false,
            currentOnboardingStep: "profile",
            completedSteps: [],
          });
        },

        getOnboardingStatus: () => {
          const { isOnboarded, currentOnboardingStep, completedSteps } = get();
          return {
            isOnboarded,
            currentOnboardingStep,
            completedSteps,
            hasUser: !!get().user,
          };
        },
      }),
      {
        name: "auth-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          isOnboarded: state.isOnboarded,
          currentOnboardingStep: state.currentOnboardingStep,
          completedSteps: state.completedSteps,
          // Don't persist user data in regular storage - it's in SecureStore
        }),
      }
    ),
    { name: "auth-store" }
  )
);
