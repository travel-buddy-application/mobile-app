import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedButtonProps = {
  title: string;
  type?: "default" | "success" | "delete";
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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
    {},
    type === "success"
      ? "successButtonBackground"
      : type === "delete"
      ? "deleteButtonBackground"
      : "primaryButtonBackground"
  );

  // Get theme-aware text color based on button type
  const textColor = useThemeColor(
    {},
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
          textStyle,
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
    textAlign: "center",
  },
});
