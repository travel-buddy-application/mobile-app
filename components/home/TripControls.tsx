import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ThemedButton } from "@/components/themed-button";
import { useThemeColor } from "@/hooks/use-theme-color";

interface Props {
  activeTrip: any;
  onStart: () => void;
  onEnd: () => void;
  onSOS: () => void;
  contactsCount: number;
}

export const TripControls: React.FC<Props> = ({
  activeTrip,
  onStart,
  onEnd,
  onSOS,
  contactsCount,
}) => {
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const textColor = useThemeColor({}, "primaryButtonText");

  if (activeTrip) {
    return (
      <ThemedView
        style={[
          styles.activeTripCard,
          { backgroundColor: cardBackgroundColor },
        ]}
      >
        <ThemedText
          type="subtitle"
          style={[styles.activeTripTitle, { color: textColor }]}
        >
          🚗 Active Trip
        </ThemedText>
        <ThemedText style={[styles.activeTripSubtitle, { color: textColor }]}>
          Status: {activeTrip.status}
        </ThemedText>
        <ThemedText style={[styles.activeTripTime, { color: textColor }]}>
          Started: {new Date(activeTrip.startAt).toLocaleTimeString()}
        </ThemedText>
        <ThemedButton
          title="🆘 Emergency SOS"
          onPress={onSOS}
          type="delete"
          style={styles.sosButton}
          textStyle={styles.sosButtonText}
        />
        <ThemedButton
          title="🛑 End Safe Trip"
          onPress={onEnd}
          style={[
            styles.sosButton,
            { backgroundColor: "#6B7280", marginTop: 10 },
          ]}
          textStyle={styles.sosButtonText}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.startTripCard}>
      <ThemedText type="subtitle" style={styles.startTripTitle}>
        Ready for a safe journey?
      </ThemedText>
      <ThemedText style={styles.startTripSubtitle}>
        Start a protected trip to enable safety monitoring
      </ThemedText>
      {contactsCount === 0 && (
        <ThemedText
          style={[
            styles.startTripSubtitle,
            { color: "#F44336", marginBottom: 12, fontSize: 12 },
          ]}
        >
          ⚠️ At least one emergency contact is required to start a safe trip
        </ThemedText>
      )}
      {contactsCount > 0 && (
        <>
          <ThemedText
            style={[
              styles.startTripSubtitle,
              { color: "#4CAF50", marginBottom: 12, fontSize: 12 },
            ]}
          >
            ✅ You have {contactsCount} emergency contact(s) set up
          </ThemedText>
        </>
      )}
      <ThemedButton
        title="🛡️ Start Trip"
        onPress={onStart}
        style={styles.startTripButton}
        textStyle={styles.startTripButtonText}
        disabled={contactsCount === 0}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  activeTripCard: { padding: 20, borderRadius: 12 },
  activeTripTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  activeTripSubtitle: { fontSize: 14, marginBottom: 4 },
  activeTripTime: { fontSize: 12, marginBottom: 15 },
  sosButton: { marginTop: 10 },
  sosButtonText: { color: "white", fontWeight: "bold" },
  startTripCard: { padding: 20, borderRadius: 12, alignItems: "center" },
  startTripTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  startTripSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  startTripButton: { minWidth: 200 },
  startTripButtonText: { color: "white", fontWeight: "bold" },
});

export default TripControls;
