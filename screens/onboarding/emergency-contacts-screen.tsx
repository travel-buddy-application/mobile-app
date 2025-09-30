import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuthStore, useContactStore } from "@/stores";
import { ContactCreateInput } from "@/types/trip";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

interface EmergencyContactsScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const EmergencyContactsScreen: React.FC<
  EmergencyContactsScreenProps
> = ({ onComplete, onSkip }) => {
  const { contacts, addContact, deleteContact, isLoading, error, clearError } =
    useContactStore();
  const { completeOnboardingStep } = useAuthStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const inputBackgroundColor = useThemeColor(
    { light: "#f9f9f9", dark: "#2a2a2a" },
    "background"
  );
  const inputBorderColor = useThemeColor(
    { light: "#ddd", dark: "#555" },
    "text"
  );
  const placeholderTextColor = useThemeColor(
    { light: "#999", dark: "#888" },
    "text"
  );
  const cardBackgroundColor = useThemeColor(
    { light: "#fff", dark: "#2a2a2a" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#f0f0f0", dark: "#404040" },
    "text"
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ContactCreateInput>({
    displayName: "",
    phone: "",
    sharingPolicy: "all",
  });

  const [errors, setErrors] = useState<Partial<ContactCreateInput>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactCreateInput> = {};

    // Name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = "Name is required";
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = "Name must be at least 2 characters";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddContact = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await addContact(formData);

      // Reset form
      setFormData({
        displayName: "",
        phone: "",
        sharingPolicy: "all",
      });
      setErrors({});
      setShowAddForm(false);

      Alert.alert("Success", "Emergency contact added successfully!");
    } catch (error) {
      console.error("Failed to add contact:", error);
      Alert.alert(
        "Error",
        "Failed to add emergency contact. Please try again.",
        [{ text: "OK" }]
      );
    }
  };
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

  const updateField = (field: keyof ContactCreateInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
            <ThemedView
              style={[styles.addForm, { backgroundColor: cardBackgroundColor }]}
            >
              <ThemedText type="subtitle" style={styles.formTitle}>
                Add Emergency Contact
              </ThemedText>

              {/* Name Input */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>Contact Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      color: textColor,
                    },
                    errors.displayName && styles.inputError,
                  ]}
                  placeholder="Enter contact name"
                  placeholderTextColor={placeholderTextColor}
                  value={formData.displayName}
                  onChangeText={(value) => updateField("displayName", value)}
                  autoCapitalize="words"
                  autoComplete="name"
                />
                {errors.displayName && (
                  <ThemedText style={styles.errorText}>
                    {errors.displayName}
                  </ThemedText>
                )}
              </ThemedView>

              {/* Phone Input */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      color: textColor,
                    },
                    errors.phone && styles.inputError,
                  ]}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={placeholderTextColor}
                  value={formData.phone}
                  onChangeText={(value) => updateField("phone", value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <ThemedText style={styles.errorText}>
                    {errors.phone}
                  </ThemedText>
                )}
              </ThemedView>

              {/* Sharing Policy */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>
                  What to share with this contact?
                </ThemedText>
                <ThemedView style={styles.policyButtons}>
                  {[
                    {
                      value: "location",
                      label: "📍 Location only",
                      desc: "Share location tracking",
                    },
                    {
                      value: "alerts",
                      label: "🚨 Alerts only",
                      desc: "Emergency notifications",
                    },
                    {
                      value: "all",
                      label: "🔄 Everything",
                      desc: "Location + alerts",
                    },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.policyButton,
                        { borderColor: inputBorderColor },
                        formData.sharingPolicy === option.value &&
                          styles.policyButtonActive,
                      ]}
                      onPress={() => updateField("sharingPolicy", option.value)}
                    >
                      <ThemedText
                        style={[
                          styles.policyButtonText,
                          formData.sharingPolicy === option.value &&
                            styles.policyButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.policyButtonDesc,
                          formData.sharingPolicy === option.value &&
                            styles.policyButtonDescActive,
                        ]}
                      >
                        {option.desc}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ThemedView>

              {/* Error Message */}
              {error && (
                <ThemedView style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </ThemedView>
              )}

              {/* Form Buttons */}
              <ThemedView style={styles.formButtons}>
                <ThemedButton
                  title="Cancel"
                  onPress={() => {
                    setShowAddForm(false);
                    setFormData({
                      displayName: "",
                      phone: "",
                      sharingPolicy: "all",
                    });
                    setErrors({});
                  }}
                  style={
                    [
                      styles.cancelButton,
                      { borderColor: inputBorderColor },
                    ] as any
                  }
                  textStyle={styles.cancelButtonText}
                />
                <ThemedButton
                  title={isLoading ? "Adding..." : "Add Contact"}
                  onPress={handleAddContact}
                  disabled={isLoading}
                  style={styles.addButton}
                  textStyle={styles.addButtonText}
                />
              </ThemedView>
            </ThemedView>
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
  addForm: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  inputGroup: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4757",
    backgroundColor: "#fff5f5",
  },
  errorText: {
    color: "#ff4757",
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: "#fff5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  policyButtons: {
    gap: 12,
  },
  policyButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  policyButtonActive: {
    borderColor: "#555",
    backgroundColor: "#f0f8ff",
  },
  policyButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  policyButtonTextActive: {
    color: "#000",
  },
  policyButtonDesc: {
    fontSize: 12,
  },
  policyButtonDescActive: {
    color: "#000",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    backgroundColor: "transparent",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#2f95dc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addContactSection: {
    marginBottom: 20,
  },
  addContactButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  addContactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
