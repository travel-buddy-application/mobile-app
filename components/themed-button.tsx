import { TouchableOpacity, Text, type TextStyle, type ViewStyle, StyleSheet } from "react-native";

import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedButtonProps = {
  title: string;
  type?: "default" | "success" | "delete";
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function ThemedButton({
  title,
  type = "default",
  onPress,
  disabled = false,
  style,
  textStyle,
  ...rest
}: ThemedButtonProps) {
  // Get theme-aware background color based on button type
  const backgroundColor = useThemeColor(
    {
      light: type === "success" 
        ? Colors.light.successButtonBackground 
        : type === "delete" 
        ? Colors.light.deleteButtonBackground 
        : Colors.light.primaryButtonBackground,
      dark: type === "success" 
        ? Colors.dark.successButtonBackground 
        : type === "delete" 
        ? Colors.dark.deleteButtonBackground 
        : Colors.dark.primaryButtonBackground,
    },
    type === "success" 
      ? "successButtonBackground" 
      : type === "delete" 
      ? "deleteButtonBackground" 
      : "primaryButtonBackground"
  );

  // Get theme-aware text color based on button type
  const textColor = useThemeColor(
    {
      light: type === "success" 
        ? Colors.light.successButtonText 
        : type === "delete" 
        ? Colors.light.deleteButtonText 
        : Colors.light.primaryButtonText,
      dark: type === "success" 
        ? Colors.dark.successButtonText 
        : type === "delete" 
        ? Colors.dark.deleteButtonText 
        : Colors.dark.primaryButtonText,
    },
    type === "success" 
      ? "successButtonText" 
      : type === "delete" 
      ? "deleteButtonText" 
      : "primaryButtonText"
  );

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: disabled ? "#cccccc" : backgroundColor },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...rest}
    >
      <Text 
        style={[
          styles.buttonText, 
          { color: disabled ? "#666666" : textColor },
          textStyle
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});