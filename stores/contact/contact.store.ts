import { Contact, ContactCreateInput } from "@/types/trip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface ContactStoreState {
  // State
  contacts: Contact[];
  selectedContacts: string[]; // Contact IDs for current trip
  isLoading: boolean;
  error: string | null;

  // Actions
  addContact: (contact: ContactCreateInput) => Promise<string>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  selectContact: (id: string) => void;
  deselectContact: (id: string) => void;
  selectAllContacts: () => void;
  clearSelectedContacts: () => void;
  getContactById: (id: string) => Contact | undefined;
  syncContactKeys: () => Promise<void>;
  clearError: () => void;
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

        // Add new contact
        addContact: async (contactData: ContactCreateInput) => {
          set({ isLoading: true, error: null });

          try {
            const newContact: Contact = {
              id: Date.now().toString(),
              ...contactData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Store contact in secure storage if has push token
            if (newContact.pushToken) {
              await SecureStore.setItemAsync(
                `contact_token_${newContact.id}`,
                newContact.pushToken
              );
            }

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
