import { useThemeColor } from "@/hooks/use-theme-color";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedButton } from "../themed-button";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
export function UserNotLoggedIn() {
  const backgroundColor = useThemeColor({}, "background");
  return (
    <SafeAreaView style={[{ flex: 1 }, { backgroundColor }]}>
      <ThemedView style={styles.errorContainer}>
        <MaterialIcons name="login" size={64} color="#4CAF50" />
        <ThemedText style={styles.errorTitle}>User Not Logged In</ThemedText>
        <ThemedText style={styles.errorMessage}>
          You need to be logged in to accept this invitation.
        </ThemedText>
        <ThemedButton
          title="Log In"
          onPress={() => router.push("/(onboarding)/welcome")}
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
