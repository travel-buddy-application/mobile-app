import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { StyleSheet } from "react-native";

export const SafetyFeatures: React.FC = () => {
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");
  return (
    <>
      <ThemedView style={styles.featuresContainer}>
        <ThemedText type="subtitle" style={styles.featuresTitle}>
          Safety Features
        </ThemedText>
        <ThemedView
          style={[
            styles.featuresList,
            { backgroundColor: cardBackgroundColor },
          ]}
        >
          <ThemedView
            style={[styles.featureItem, { borderBottomColor: borderColor }]}
          >
            <ThemedText style={styles.featureIcon}>📍</ThemedText>
            <ThemedText style={styles.featureText}>
              Real-time Location Sharing
            </ThemedText>
            <ThemedText style={styles.comingSoon}>Active</ThemedText>
          </ThemedView>
          <ThemedView
            style={[styles.featureItem, { borderBottomColor: borderColor }]}
          >
            <ThemedText style={styles.featureIcon}>⚠️</ThemedText>
            <ThemedText style={styles.featureText}>
              User Stationary Detection
            </ThemedText>
            <ThemedText style={styles.comingSoon}>Active</ThemedText>
          </ThemedView>
          <ThemedView
            style={[styles.featureItem, { borderBottomColor: borderColor }]}
          >
            <ThemedText style={styles.featureIcon}>📱</ThemedText>
            <ThemedText style={styles.featureText}>Smart SOS Alerts</ThemedText>
            <ThemedText style={styles.comingSoon}>Active</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </>
  );
};

const styles = StyleSheet.create({
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  featuresList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  comingSoon: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
  },
});
