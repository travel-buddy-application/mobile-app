import { ThemedButton } from "@/components/themed-button";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

interface AddContactPersonProps {
  onAdd: (contact: { name: string; email: string; phone: string }) => void;
}

const AddContactPerson: React.FC<AddContactPersonProps> = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setErrors({});

      Alert.alert("Success", "Contact person added successfully!");
    }
  };

  const isFormValid = name.trim() && email.trim() && phone.trim();

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={{ marginBottom: 16 }}>
        Add Contact Person
      </ThemedText>
      <ThemedInput
        label="Name"
        placeholder="Enter contact name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
        containerStyle={styles.inputContainer}
      />

      <ThemedInput
        label="Email"
        placeholder="Enter email address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.inputContainer}
      />

      <ThemedInput
        label="Phone"
        placeholder="Enter phone number"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        keyboardType="phone-pad"
        containerStyle={styles.inputContainer}
      />

      <ThemedButton
        title="Add Contact"
        onPress={handleSubmit}
        disabled={!isFormValid}
        type="success"
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AddContactPerson;
