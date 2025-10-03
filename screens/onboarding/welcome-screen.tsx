import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuthStore } from "@/stores";
import { UserCreateInput } from "@/types/user";
import {
  isRequired,
  isValidEmail,
  isValidPhoneNumber,
} from "@/utils/validation";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const { createUserProfile, isLoading, error, clearError } = useAuthStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const inputBackgroundColor = useThemeColor({}, "inputBackgroundColor");
  const inputBorderColor = useThemeColor({}, "inputBorderColor");
  const placeholderTextColor = useThemeColor({}, "placeholderTextColor");

  const [formData, setFormData] = useState<UserCreateInput>({
    name: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState<Partial<UserCreateInput>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserCreateInput> = {};

    // Name validation
    if (!isRequired(formData.name)) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone validation
    if (!isRequired(formData.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Email validation (optional)
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }
    try {
      await createUserProfile(formData);
      onComplete();
    } catch (error) {
      console.error("Profile creation failed:", error);
      Alert.alert("Error", "Failed to create profile. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const updateField = (field: keyof UserCreateInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
            <ThemedText style={styles.emoji}>🧳</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Welcome to Travel Buddy
            </ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>
              Your safety companion on every journey
            </ThemedText>
          </ThemedView>
          {/* Form */}
          <ThemedView style={styles.form}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Let&apos;s get to know you
            </ThemedText>
            {/* Name Input */}
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                What&apos;s your name?
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBackgroundColor,
                    borderColor: inputBorderColor,
                    color: textColor,
                  },
                  errors.name && styles.inputError,
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={placeholderTextColor}
                value={formData.name}
                onChangeText={(value) => updateField("name", value)}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
              {errors.name && (
                <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
              )}
            </ThemedView>
            {/* Phone Input */}
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>Phone number</ThemedText>
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
                textContentType="telephoneNumber"
              />
              {errors.phone && (
                <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>
              )}
            </ThemedView>
            {/* Email Input (Optional) */}
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.label}>
                Email address
                <ThemedText style={styles.optional}>(optional)</ThemedText>
              </ThemedText>
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
                placeholder="your@email.com"
                placeholderTextColor={placeholderTextColor}
                value={formData.email}
                onChangeText={(value) => updateField("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {errors.email && (
                <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
              )}
            </ThemedView>
            {/* Error Message */}
            {error && (
              <ThemedView style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </ThemedView>
            )}
            {/* Continue Button */}
            <ThemedButton
              title={isLoading ? "Creating Profile..." : "Continue"}
              onPress={handleContinue}
              disabled={isLoading}
              style={styles.continueButton}
            />
            {/* Info Text */}
            <ThemedText style={styles.infoText}>
              This information helps us identify you in case of emergencies.
            </ThemedText>
          </ThemedView>
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
    marginBottom: 32,
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
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  optional: {
    fontSize: 14,
    fontWeight: "normal",
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
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: "#ccc",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
