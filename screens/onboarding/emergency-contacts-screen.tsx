import AddContactForm from "@/components/emergencyContacts/add-contact-form";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuthStore, useContactStore } from "@/stores";
import React, { useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface EmergencyContactsScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const EmergencyContactsScreen: React.FC<
  EmergencyContactsScreenProps
> = ({ onComplete, onSkip }) => {
  const { contacts, deleteContact, setShowAddForm, showAddForm } =
    useContactStore();
  const { completeOnboardingStep } = useAuthStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");

  const inputBorderColor = useThemeColor(
    {
      light: Colors.light.inputBorderColor,
      dark: Colors.dark.inputBorderColor,
    },
    "inputBorderColor"
  );

  const cardBackgroundColor = useThemeColor(
    {
      light: Colors.light.cardBackgroundColor,
      dark: Colors.dark.cardBackgroundColor,
    },
    "cardBackgroundColor"
  );
  const borderColor = useThemeColor(
    { light: Colors.light.cardBorderColor, dark: Colors.dark.cardBorderColor },
    "cardBorderColor"
  );

  useEffect(() => {
    setShowAddForm(false);
  }, [setShowAddForm]);

  const handleDeleteContact = async (
    contactId: string,
    contactName: string
  ) => {
    Alert.alert(
      "Remove Contact",
      `Are you sure you want to remove ${contactName} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact(contactId);
              Alert.alert("Success", "Emergency contact removed successfully!");
            } catch (error) {
              console.error("Failed to delete contact:", error);
              Alert.alert(
                "Error",
                "Failed to remove emergency contact. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    // Mark contacts step as complete
    completeOnboardingStep("contacts");

    if (contacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Are you sure you want to continue without adding emergency contacts? You can add them later in settings.",
        [
          { text: "Add Contact", style: "cancel" },
          {
            text: "Continue Anyway",
            style: "destructive",
            onPress: onComplete,
          },
        ]
      );
    } else {
      onComplete();
    }
  };
  const handleSkip = () => {
    // Mark contacts step as complete even when skipped
    completeOnboardingStep("contacts");

    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText style={styles.emoji}>👥</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Emergency Contacts
            </ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Add trusted contacts who will be notified if you need help
            </ThemedText>
          </ThemedView>

          {/* Contact List */}
          <ThemedView style={styles.contactsList}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Emergency Contacts ({contacts.length})
            </ThemedText>
            {contacts.length > 0 ? (
              contacts.map((contact) => (
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
                  <ThemedView style={styles.contactInfo}>
                    <ThemedText style={styles.contactName}>
                      {contact.displayName}
                    </ThemedText>
                    <ThemedText style={styles.contactPhone}>
                      {contact.phone}
                    </ThemedText>
                    <ThemedText style={styles.sharingPolicy}>
                      Sharing: {contact.sharingPolicy}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        handleDeleteContact(contact.id, contact.displayName)
                      }
                    >
                      <ThemedText style={styles.deleteButtonText}>
                        🗑️
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              ))
            ) : (
              <ThemedView
                style={[styles.emptyState, { borderColor: borderColor }]}
              >
                <ThemedText style={styles.emptyStateText}>
                  No emergency contacts added yet
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Add contacts who can help you in case of emergency
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {/* Add Contact Form */}
          {showAddForm ? (
            <AddContactForm />
          ) : (
            /* Add Contact Button */
            <ThemedView style={styles.addContactSection}>
              <ThemedButton
                title="➕ Add Emergency Contact"
                onPress={() => setShowAddForm(true)}
                style={styles.addContactButton}
                textStyle={styles.addContactButtonText}
              />
            </ThemedView>
          )}

          {/* Navigation Buttons */}
          <ThemedView style={styles.navigationButtons}>
            {contacts.length > 0 && (
              <ThemedButton
                title="Continue"
                onPress={handleContinue}
                style={styles.continueButton}
                textStyle={styles.continueButtonText}
              />
            )}
            <ThemedButton
              title={contacts.length > 0 ? "Skip for now" : "Skip this step"}
              onPress={handleSkip}
              style={
                [styles.skipButton, { borderColor: inputBorderColor }] as any
              }
              textStyle={styles.skipButtonText}
            />
          </ThemedView>

          {/* Info Text */}
          <ThemedText style={styles.infoText}>
            Emergency contacts will receive notifications when you trigger an
            SOS or if our safety monitoring detects potential issues during your
            trips.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 24,
  },
  emoji: {
    padding: 30,
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  contactsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  sharingPolicy: {
    fontSize: 12,
    fontStyle: "italic",
  },
  contactIcon: {
    padding: 10,
    fontSize: 24,
  },
  contactActions: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ff4757",
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addContactSection: {
    marginBottom: 20,
  },
  addContactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addContactButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  navigationButtons: {
    gap: 12,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: "#2f95dc",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
});
