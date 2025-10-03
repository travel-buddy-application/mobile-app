import AddContactForm from "@/components/emergencyContacts/add-contact-form";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useContactStore } from "@/stores";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const ContactsScreen: React.FC = () => {
  const { contacts, deleteContact, setShowAddForm, showAddForm } =
    useContactStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");
  const textColor = useThemeColor({}, "text");
  const dangerColor = "#F44336";

  const handleDeleteContact = (contactId: string, contactName: string) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to remove ${contactName} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteContact(contactId),
        },
      ]
    );
  };

  const handleCallContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessageContact = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Emergency Contacts
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage your trusted contacts for emergencies
          </ThemedText>
        </ThemedView>

        {/* Add Contact Button */}
        <ThemedButton
          title="+ Add Emergency Contact"
          onPress={() => setShowAddForm(true)}
          style={styles.addButton}
          textStyle={styles.addButtonText}
        />

        {/* Add Contact Form */}
        {showAddForm && (
          <ThemedView style={styles.formContainer}>
            <AddContactForm />
          </ThemedView>
        )}

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <ThemedView style={styles.contactsList}>
            {contacts.map((contact) => (
              <ThemedView
                key={contact.id}
                style={[
                  styles.contactCard,
                  {
                    backgroundColor: cardBackgroundColor,
                    borderColor: borderColor,
                  },
                ]}
              >
                <ThemedView style={styles.contactContent}>
                  <ThemedView style={styles.contactHeader}>
                    <ThemedView style={styles.contactInfo}>
                      <ThemedText style={styles.contactName}>
                        {contact.displayName}
                      </ThemedText>
                      <ThemedText style={styles.contactRelationship}>
                        {contact.status}
                      </ThemedText>
                    </ThemedView>
                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteContact(contact.id, contact.displayName)
                      }
                      style={[
                        styles.deleteButton,
                        {
                          backgroundColor: cardBackgroundColor,
                          borderRadius: 6,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={20}
                        color={dangerColor}
                      />
                    </TouchableOpacity>
                  </ThemedView>

                  <ThemedView style={styles.contactDetails}>
                    <ThemedView style={styles.contactRow}>
                      <MaterialIcons
                        name="phone"
                        size={16}
                        color={textColor}
                        style={styles.contactIcon}
                      />
                      <ThemedText style={styles.contactText}>
                        {contact.phone}
                      </ThemedText>
                    </ThemedView>

                    {contact.email && (
                      <ThemedView style={styles.contactRow}>
                        <MaterialIcons
                          name="email"
                          size={16}
                          color={textColor}
                          style={styles.contactIcon}
                        />
                        <ThemedText style={styles.contactText}>
                          {contact.email}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.contactActions}>
                  <TouchableOpacity
                    onPress={() => handleCallContact(contact.phone)}
                    style={[styles.actionButton, styles.callButton]}
                  >
                    <MaterialIcons name="phone" size={18} color="white" />
                    <ThemedText style={styles.actionButtonText}>
                      Call
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleMessageContact(contact.phone)}
                    style={[styles.actionButton, styles.messageButton]}
                  >
                    <MaterialIcons name="message" size={18} color="white" />
                    <ThemedText style={styles.actionButtonText}>
                      Message
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        ) : (
          <ThemedView style={styles.emptyState}>
            <MaterialIcons
              name="contacts"
              size={64}
              color={textColor}
              style={styles.emptyIcon}
            />
            <ThemedText style={styles.emptyTitle}>
              No Emergency Contacts
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Add trusted contacts who will be notified in case of emergencies
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contactContent: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 20,
  },
  contactsList: {
    gap: 15,
  },
  contactCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 4,
  },
  contactDetails: {
    marginBottom: 15,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    marginRight: 8,
    opacity: 0.7,
  },
  contactText: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "transparent",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    gap: 5,
  },
  callButton: {
    backgroundColor: "#4CAF50",
  },
  messageButton: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "semibold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    maxWidth: 280,
  },
});
