import { useThemeColor } from "@/hooks/use-theme-color";
import { useContactStore } from "@/stores";
import { ContactCreateInput } from "@/types/trip";
import {
  isRequired,
  isValidEmail,
  isValidPhoneNumber,
} from "@/utils/validation";
import { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { ThemedButton } from "../themed-button";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

export default function AddContactForm() {
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const placeholderTextColor = useThemeColor({}, "placeholderTextColor");
  const textColor = useThemeColor({}, "text");
  const inputBackgroundColor = useThemeColor({}, "inputBackgroundColor");
  const inputBorderColor = useThemeColor({}, "inputBorderColor");
  const { isLoading, error, clearError, addContact, setShowAddForm } =
    useContactStore();

  // functions

  const [errors, setErrors] = useState<Partial<ContactCreateInput>>({});
  const [formData, setFormData] = useState<ContactCreateInput>({
    displayName: "",
    phone: "",
    sharingPolicy: "all",
    email: "",
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactCreateInput> = {};

    // Name validation
    if (!isRequired(formData.displayName)) {
      newErrors.displayName = "Name is required";
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = "Name must be at least 2 characters";
    }

    // Phone validation
    if (!isRequired(formData.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Email validation (optional)
    if (!isRequired(formData.email)) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
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
        email: "",
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
  const updateField = (field: keyof ContactCreateInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };
  return (
    <ThemedView>
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
            placeholder="+94 712 345 678"
            placeholderTextColor={placeholderTextColor}
            value={formData.phone}
            onChangeText={(value) => updateField("phone", value)}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {errors.phone && (
            <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
          )}
        </ThemedView>

        {/* Email Input */}
        <ThemedView style={styles.inputGroup}>
          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackgroundColor,
                borderColor: inputBorderColor,
                color: textColor,
              },
              errors.email && styles.inputError,
            ]}
            placeholder="Enter email address"
            placeholderTextColor={placeholderTextColor}
            value={formData.email}
            onChangeText={(value) => updateField("email", value)}
            autoCapitalize="none"
            autoComplete="email"
          />
          {errors.email && (
            <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
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
                email: "",
              });
              setErrors({});
            }}
            style={
              [styles.cancelButton, { borderColor: inputBorderColor }] as any
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
