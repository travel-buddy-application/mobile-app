// Contact Selector Modal for Emergency Contact Selection
// Allows selecting a single emergency contact from accepted contacts

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Contact } from "@/types/trip";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ContactSelectorModalProps {
  visible: boolean;
  contacts: Contact[];
  selectedContactId?: string;
  onSelectContact: (contactId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ContactSelectorModal: React.FC<ContactSelectorModalProps> = ({
  visible,
  contacts,
  selectedContactId,
  onSelectContact,
  onCancel,
  onConfirm,
}) => {
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");

  // Filter to only show accepted contacts
  const acceptedContacts = contacts.filter(
    (contact) => contact.status === "accepted"
  );

  const selectedContact = acceptedContacts.find(
    (contact) => contact.id === selectedContactId
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <ThemedView
          style={[
            styles.modalContainer,
            { backgroundColor: backgroundColor, borderColor: borderColor },
          ]}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Select Emergency Contact
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Choose one emergency contact to monitor your safe trip
            </ThemedText>
          </ThemedView>

          {/* Contact List */}
          <ScrollView style={styles.contactList}>
            {acceptedContacts.length === 0 ? (
              <ThemedView style={styles.noContactsContainer}>
                <ThemedText style={styles.noContactsText}>
                  No accepted emergency contacts available.
                </ThemedText>
                <ThemedText style={styles.noContactsSubtext}>
                  Please ensure you have at least one accepted emergency contact
                  to start a safe trip.
                </ThemedText>
              </ThemedView>
            ) : (
              acceptedContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[
                    styles.contactItem,
                    {
                      backgroundColor:
                        selectedContactId === contact.id
                          ? "#4CAF50"
                          : cardBackgroundColor,
                      borderColor: borderColor,
                    },
                  ]}
                  onPress={() => onSelectContact(contact.id)}
                  activeOpacity={0.7}
                >
                  <ThemedView style={styles.contactInfo}>
                    <ThemedView style={styles.contactHeader}>
                      <ThemedText style={styles.contactName}>
                        {selectedContactId === contact.id ? "✅" : "⭕"}
                        {contact.displayName}
                      </ThemedText>
                      <ThemedText style={styles.contactStatus}>
                        🟢 Accepted
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.contactDetails}>
                      📧 {contact.email}
                    </ThemedText>
                    <ThemedText style={styles.contactDetails}>
                      📱 {contact.phone}
                    </ThemedText>
                    <ThemedText style={styles.contactPolicy}>
                      Sharing: {contact.sharingPolicy}
                    </ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Selected Contact Summary */}
          {selectedContact && (
            <ThemedView style={styles.selectedSummary}>
              <ThemedText style={styles.selectedLabel}>
                Selected Contact:
              </ThemedText>
              <ThemedText style={styles.selectedName}>
                ✅ {selectedContact.displayName}
              </ThemedText>
            </ThemedView>
          )}

          {/* Action Buttons */}
          <ThemedView style={styles.buttonContainer}>
            <ThemedButton
              title="Cancel"
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
            <ThemedButton
              title="Start Safe Trip"
              onPress={onConfirm}
              disabled={!selectedContactId || acceptedContacts.length === 0}
              style={[
                styles.button,
                styles.confirmButton,
                {
                  opacity:
                    !selectedContactId || acceptedContacts.length === 0
                      ? 0.5
                      : 1,
                },
              ]}
              textStyle={styles.confirmButtonText}
            />
          </ThemedView>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  contactList: {
    maxHeight: 300,
    paddingHorizontal: 15,
  },
  contactItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
  },
  contactInfo: {
    borderRadius: 12,
    padding: 10,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  contactStatus: {
    fontSize: 12,
    opacity: 0.8,
  },
  contactDetails: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 2,
  },
  contactPolicy: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 4,
  },
  noContactsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noContactsText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  noContactsSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  selectedSummary: {
    padding: 15,
    margin: 15,
    backgroundColor: "#555",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 15,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#9E9E9E",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
