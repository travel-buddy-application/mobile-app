import { View, type ViewProps } from 'react-native';

import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor = Colors.light.background,
  darkColor = Colors.dark.background,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
