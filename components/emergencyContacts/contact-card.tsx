import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { errorColor, successColor } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useContactStore } from "@/stores/contact/contact.store";
import { Contact } from "@/types/trip";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, Linking, StyleSheet, TouchableOpacity } from "react-native";

interface ContactCardProps {
  contact: Contact;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
  // Theme colors
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");
  const textColor = useThemeColor({}, "text");
  const defaultTextColour = useThemeColor({}, "placeholderTextColor");

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return successColor; // Green
      case "declined":
        return errorColor; // Red
      case "pending":
      default:
        return defaultTextColour; // Normal color
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "Accepted";
      case "declined":
        return "Declined";
      case "pending":
      default:
        return "Pending";
    }
  };

  const { deleteContact } = useContactStore();
  const handleDeleteContact = () => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to remove ${contact.displayName} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteContact(contact.id),
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
    <ThemedView
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
            <ThemedText
              style={[
                styles.contactRelationship,
                { color: getStatusColor(contact.status) },
              ]}
            >
              {getStatusText(contact.status)}
            </ThemedText>
          </ThemedView>
          <TouchableOpacity
            onPress={handleDeleteContact}
            style={[
              styles.deleteButton,
              {
                backgroundColor: cardBackgroundColor,
                borderRadius: 6,
              },
            ]}
          >
            <MaterialIcons name="delete-outline" size={20} color={errorColor} />
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
            <ThemedText style={styles.contactText}>{contact.phone}</ThemedText>
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
          <ThemedText style={styles.actionButtonText}>Call</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleMessageContact(contact.phone)}
          style={[styles.actionButton, styles.messageButton]}
        >
          <MaterialIcons name="message" size={18} color="white" />
          <ThemedText style={styles.actionButtonText}>Message</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  contactCard: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactContent: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
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
    fontWeight: "semibold",
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
});
