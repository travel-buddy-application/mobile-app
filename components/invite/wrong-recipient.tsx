import { useThemeColor } from "@/hooks/use-theme-color";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedButton } from "../themed-button";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
export function WrongRecipient() {
  const backgroundColor = useThemeColor({}, "background");
  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor }]}>
      <ThemedView style={styles.errorContainer}>
        <MaterialIcons name="person-off" size={64} color="#ff6b6b" />
        <ThemedText style={styles.errorTitle}>Wrong Recipient</ThemedText>
        <ThemedText style={styles.errorMessage}>
          Please make sure you&apos;re logged in with the correct email address
          or contact the sender.
        </ThemedText>
        <ThemedButton
          title="Go Home"
          onPress={() => router.back()}
          style={{
            marginTop: 20,
          }}
          type="success"
        />
      </ThemedView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 20,
  },
});
