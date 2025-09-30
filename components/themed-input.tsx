import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export type ThemedInputProps = TextInputProps & {
  label?: string;
  secureTextEntry?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  disabled?: boolean;
};

export function ThemedInput({
  label,
  secureTextEntry,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  value,
  onChangeText,
  disabled,
  ...props
}: ThemedInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Theme-aware colors
  const textColor = useThemeColor(
    { light: Colors.light.text, dark: Colors.dark.text },
    "text"
  );

  const backgroundColor = useThemeColor(
    { light: Colors.light.inputBackground, dark: Colors.dark.inputBackground },
    "inputBackground"
  );

  const borderColor = useThemeColor(
    { light: Colors.light.inputBorder, dark: Colors.dark.inputBorder },
    "inputBorder"
  );

  const placeholderColor = useThemeColor(
    {
      light: Colors.light.inputPlaceholder,
      dark: Colors.dark.inputPlaceholder,
    },
    "inputPlaceholder"
  );

  const isPassword = secureTextEntry;
  const shouldSecureText = isPassword && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: textColor }, labelStyle]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor: error
              ? Colors.light.error
              : isFocused
              ? Colors.light.primary
              : borderColor,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              paddingRight: isPassword ? 50 : 12,
            },
            inputStyle,
          ]}
          secureTextEntry={shouldSecureText}
          placeholderTextColor={placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={placeholderColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={[styles.errorText, { color: Colors.light.error }, errorStyle]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
