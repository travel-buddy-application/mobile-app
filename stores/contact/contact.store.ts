import { DeepLinkService, InvitationData } from "@/services/deep-link.service";
import { emailService } from "@/services/email.service";
import { sendPushNotification } from "@/services/notifications.service";
import { Contact, ContactCreateInput } from "@/types/trip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { useAuthStore } from "../auth/auth.store";

interface ContactStoreState {
  // State
  contacts: Contact[];
  selectedContacts: string[]; // Contact IDs for current trip
  isLoading: boolean;
  error: string | null;
  showAddForm: boolean;
  // Actions
  addContact: (contact: ContactCreateInput) => Promise<string>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  updateContactByEmail: (
    email: string,
    updates: Partial<Contact>
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  selectContact: (id: string) => void;
  deselectContact: (id: string) => void;
  selectAllContacts: () => void;
  clearSelectedContacts: () => void;
  clearAllContacts: () => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  syncContactKeys: () => Promise<void>;
  clearError: () => void;
  setShowAddForm: (show: boolean) => void;
  acceptRequest: (invitationData: ContactCreateInput) => Promise<string>;
}

export const useContactStore = create<ContactStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        contacts: [],
        selectedContacts: [],
        isLoading: false,
        error: null,
        showAddForm: false,
        setShowAddForm: (show: boolean) => set({ showAddForm: show }),

        // Add new contact
        addContact: async (contactData: ContactCreateInput) => {
          set({ isLoading: true, error: null });

          try {
            const currentContacts = get().contacts;

            // Check for duplicate email
            const existingContactByEmail = currentContacts.find(
              (contact) =>
                contact.email.toLowerCase() === contactData.email.toLowerCase()
            );

            if (existingContactByEmail) {
              const errorMessage = `A contact with email ${contactData.email} already exists (${existingContactByEmail.displayName})`;
              set({
                error: errorMessage,
                isLoading: false,
              });
              throw new Error(errorMessage);
            }

            // Check for duplicate phone number
            const existingContactByPhone = currentContacts.find(
              (contact) => contact.phone === contactData.phone
            );

            if (existingContactByPhone) {
              const errorMessage = `A contact with phone number ${contactData.phone} already exists (${existingContactByPhone.displayName})`;
              set({
                error: errorMessage,
                isLoading: false,
              });
              throw new Error(errorMessage);
            }

            const authState = useAuthStore.getState(); // <-- get fresh state
            const user = authState.user;
            if (!user) {
              throw new Error("User not logged in");
            }

            const newContact: Contact = {
              id: Date.now().toString(),
              ...contactData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: "pending",
            };

            // Store contact in secure storage if has push token
            if (newContact.pushToken) {
              await SecureStore.setItemAsync(
                `contact_token_${newContact.id}`,
                newContact.pushToken
              );
            }
            const invitationData: InvitationData = {
              senderName: user.name || "Your Friend",
              email: user.email || "",
              phone: user.phone || "",
              fcmToken: user.fcmToken || "",
              receiverEmail: newContact.email,
            };
            await emailService({
              contactPerson: newContact.displayName,
              person: user.name || "Your Friend",
              receiverEmail: newContact.email,
              dashboardUrl:
                DeepLinkService.generateInvitationLink(invitationData),
              sharingPolicy: newContact.sharingPolicy,
            });

            const contacts = [...get().contacts, newContact];
            set({
              contacts,
              isLoading: false,
            });

            return newContact.id;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to add contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Accept contact request (from invitation)
        acceptRequest: async (invitationData: ContactCreateInput) => {
          set({ isLoading: true, error: null });
          try {
            const authState = useAuthStore.getState();
            const currentUser = authState.user;

            if (!currentUser) {
              throw new Error("User not logged in");
            }

            const newContact: Contact = {
              id: Date.now().toString(),
              ...invitationData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: "accepted",
            };
            const contacts = [...get().contacts, newContact];

            set({
              contacts,
              isLoading: false,
            });

            // Send push notification to the contact requester if they have an FCM token
            if (invitationData.pushToken) {
              try {
                await sendPushNotification({
                  token: invitationData.pushToken,
                  title: "Contact Request Accepted!",
                  body: `${currentUser.name} has accepted your contact request and added you as an emergency contact.`,
                  rawData: {
                    type: "accept_contact_request",
                    senderFcmToken: currentUser.fcmToken || "",
                    senderName: currentUser.name || "",
                    senderEmail: currentUser.email || "",
                    senderPhone: currentUser.phone || "",
                  },
                });
                console.log("✅ Push notification sent to contact requester");
              } catch (notificationError) {
                console.warn(
                  "⚠️ Failed to send push notification:",
                  notificationError
                );
                // Don't throw error as the main operation (adding contact) was successful
              }
            }

            return newContact.id;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to add contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Update existing contact
        updateContact: async (id: string, updates: Partial<Contact>) => {
          set({ isLoading: true, error: null });

          try {
            const contacts = get().contacts.map((contact) => {
              if (contact.id === id) {
                const updatedContact = {
                  ...contact,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                };

                // Update secure storage if push token changed
                if (updates.pushToken !== undefined) {
                  if (updates.pushToken) {
                    SecureStore.setItemAsync(
                      `contact_token_${id}`,
                      updates.pushToken
                    );
                  } else {
                    SecureStore.deleteItemAsync(`contact_token_${id}`);
                  }
                }

                return updatedContact;
              }
              return contact;
            });

            set({
              contacts,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to update contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        updateContactByEmail: async (
          email: string,
          updates: Partial<Contact>
        ) => {
          set({ isLoading: true, error: null });
          try {
            const contacts = get().contacts.map((contact) => {
              if (contact.email.toLowerCase() === email.toLowerCase()) {
                console.log("🔄 Updating contact by email:", email, updates);
                const updatedContact = {
                  ...contact,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                };
                console.log("🔄 Updated contact data:", updatedContact);
                // Update secure storage if push token changed
                if (updates.pushToken !== undefined) {
                  if (updates.pushToken) {
                    SecureStore.setItemAsync(
                      `contact_token_${contact.id}`,
                      updates.pushToken
                    );
                  } else {
                    SecureStore.deleteItemAsync(`contact_token_${contact.id}`);
                  }
                }
                console.log("✅ Contact updated by email:", updatedContact);
                return updatedContact;
              }
              return contact;
            });

            set({
              contacts,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to update contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Delete contact
        deleteContact: async (id: string) => {
          set({ isLoading: true, error: null });

          try {
            // Remove from secure storage
            await SecureStore.deleteItemAsync(`contact_token_${id}`).catch(
              () => {
                // Ignore if key doesn't exist
              }
            );

            const contacts = get().contacts.filter(
              (contact) => contact.id !== id
            );
            const selectedContacts = get().selectedContacts.filter(
              (contactId) => contactId !== id
            );

            set({
              contacts,
              selectedContacts,
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to delete contact";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        // Select contact for current trip
        selectContact: (id: string) => {
          const selectedContacts = get().selectedContacts;
          if (!selectedContacts.includes(id)) {
            set({
              selectedContacts: [...selectedContacts, id],
            });
          }
        },

        // Deselect contact
        deselectContact: (id: string) => {
          const selectedContacts = get().selectedContacts.filter(
            (contactId) => contactId !== id
          );
          set({ selectedContacts });
        },

        // Select all contacts
        selectAllContacts: () => {
          const allContactIds = get().contacts.map((contact) => contact.id);
          set({ selectedContacts: allContactIds });
        },

        // Clear all selected contacts
        clearSelectedContacts: () => {
          set({ selectedContacts: [] });
        },

        // Get contact by ID
        getContactById: (id: string) => {
          return get().contacts.find((contact) => contact.id === id);
        },

        // Sync contact encryption keys
        syncContactKeys: async () => {
          set({ isLoading: true, error: null });

          try {
            const { contacts } = get();

            // Generate or retrieve encryption keys for each contact
            for (const contact of contacts) {
              const keyName = `contact_key_${contact.id}`;
              let existingKey = await SecureStore.getItemAsync(keyName);
              if (!existingKey) {
                // Generate new key for this contact
                const key = await Crypto.digestStringAsync(
                  Crypto.CryptoDigestAlgorithm.SHA256,
                  `${contact.id}${contact.phone}${Date.now()}`
                );
                await SecureStore.setItemAsync(keyName, key);
              }
            }

            set({ isLoading: false });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to sync contact keys";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        }, // Clear all contacts (for logout/reset)
        clearAllContacts: async () => {
          set({ isLoading: true, error: null });

          try {
            const { contacts } = get();

            // Clear all contact keys from SecureStore
            for (const contact of contacts) {
              try {
                await SecureStore.deleteItemAsync(`contact_key_${contact.id}`);
                if (contact.pushToken) {
                  await SecureStore.deleteItemAsync(
                    `contact_token_${contact.id}`
                  );
                }
              } catch (err) {
                console.warn(
                  `Failed to clear secure data for contact ${contact.id}:`,
                  err
                );
              }
            }

            // Clear contacts from state
            set({
              contacts: [],
              selectedContacts: [],
              isLoading: false,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to clear contacts";
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
      {
        name: "contact-store",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          contacts: state.contacts.map((contact) => ({
            ...contact,
            pushToken: undefined, // Don't persist tokens in regular storage
          })),
          selectedContacts: state.selectedContacts,
        }),
      }
    ),
    { name: "contact-store" }
  )
);
