// Received Trips Component for Travel Buddy
// Shows trips received from other users and allows fetching their locations

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { errorColor } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { supabaseLocationService } from "@/services/supabase/location.service";
import { useReceivedTripsSelectors } from "@/stores/received-trips/received-trips.store";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ReceivedTripsProps {
  onLocationFetch?: (sessionId: string) => void;
}

export const ReceivedTripsSection: React.FC<ReceivedTripsProps> = ({
  onLocationFetch,
}) => {
  const {
    recentSessions,
    updateSessionLastFetch,
    clearExpiredSessions,
    removeSession,
  } = useReceivedTripsSelectors();
  const [loadingSession, setLoadingSession] = useState<string | null>(null);

  // Theme colors
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");
  const backgroundColor = useThemeColor({}, "background");

  // Clear expired sessions on component mount
  useEffect(() => {
    clearExpiredSessions();
  }, [clearExpiredSessions]);

  const openMaps = async (
    lat: number,
    lng: number,
    label?: string
  ): Promise<void> => {
    const latStr = lat.toString();
    const lngStr = lng.toString();

    // Universal web link (works everywhere)
    const googleWeb = `https://www.google.com/maps/search/?api=1&query=${latStr},${lngStr}${
      label ? `&query_place_id=${encodeURIComponent(label)}` : ""
    }`;

    // Android intents (prefer the app)
    const androidGeo = `geo:${latStr},${lngStr}?q=${latStr},${lngStr}${
      label ? `(${encodeURIComponent(label)})` : ""
    }`;
    const androidNav = `google.navigation:q=${latStr},${lngStr}`;

    // iOS Google Maps URL scheme
    const iosGmaps = `comgooglemaps://?q=${latStr},${lngStr}${
      label ? `(${encodeURIComponent(label)})` : ""
    }&zoom=16`;

    // iOS Apple Maps fallback
    const iosApple = `http://maps.apple.com/?ll=${latStr},${lngStr}${
      label ? `&q=${encodeURIComponent(label)}` : ""
    }`;

    try {
      if (Platform.OS === "android") {
        const candidates = [androidNav, androidGeo, googleWeb];
        for (const url of candidates) {
          if (await Linking.canOpenURL(url)) {
            console.log(`🗺️ Opening maps with: ${url}`);
            return await Linking.openURL(url);
          }
        }
      } else {
        const candidates = [iosGmaps, iosApple, googleWeb];
        for (const url of candidates) {
          if (await Linking.canOpenURL(url)) {
            console.log(`🗺️ Opening maps with: ${url}`);
            return await Linking.openURL(url);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error opening maps:", error);
      await Linking.openURL(googleWeb);
    }
  };
  const handleFetchLocation = async (sessionId: string, userName?: string) => {
    if (loadingSession) return; // Prevent multiple simultaneous requests

    // Find the session to check if it's active
    const session = recentSessions.find((s) => s.sessionId === sessionId);

    // If session is inactive, show appropriate message
    if (session && !session.isActive) {
      Alert.alert(
        "Trip Completed",
        `${
          userName || "This person"
        }'s safety trip has ended. Live location sharing is no longer available.`,
        [{ text: "OK" }]
      );
      return;
    }

    setLoadingSession(sessionId);

    try {
      console.log("📍 Fetching latest location for session:", sessionId);

      const latestLocation = await supabaseLocationService.getLatestLocation(
        sessionId
      );

      if (latestLocation) {
        console.log("✅ Latest location found:", latestLocation);

        // Update last fetch time
        updateSessionLastFetch(sessionId);

        // Open in maps
        await openMaps(
          latestLocation.lat,
          latestLocation.lng,
          `${userName || "Safety Trip"} - ${
            session?.isActive ? "Live Location" : "Last Known Location"
          }`
        );

        // Call optional callback
        onLocationFetch?.(sessionId);
      } else {
        const isActive = session?.isActive ?? true;
        Alert.alert(
          "No Location Available",
          isActive
            ? `${
                userName || "The person"
              } hasn't shared their location yet. Please try again later.`
            : `${
                userName || "The person"
              }'s trip has ended. No location data is available.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("❌ Error fetching location:", error);
      Alert.alert(
        "Error",
        "Failed to fetch location. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoadingSession(null);
    }
  };
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleClearAllSessions = () => {
    Alert.alert(
      "Clear All Received Trips",
      "Are you sure you want to remove all received safety trips? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            recentSessions.forEach((session) => {
              removeSession(session.sessionId);
            });
            console.log("🧹 All received trips cleared");
          },
        },
      ]
    );
  };

  // Show section only if there are recent sessions
  if (recentSessions.length === 0) {
    return null;
  }
  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: borderColor,
        },
      ]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.title}>
              📱 Received Safety Trips
            </ThemedText>
            <ThemedView style={styles.countBadge}>
              <ThemedText style={styles.countText}>
                {recentSessions.length}
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClearAllSessions}
          style={[
            styles.clearButton,
            {
              backgroundColor: backgroundColor,
              borderRadius: 6,
            },
          ]}
        >
          <MaterialIcons name="delete-outline" size={22} color={errorColor} />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.subtitle}>
        People who have shared their trip with you
      </ThemedText>
      <ThemedView
        style={[
          styles.sessionsList,
          {
            backgroundColor: cardBackgroundColor,
            borderColor: borderColor,
            borderWidth: 1,
            borderRadius: 12,
          },
        ]}
      >
        {recentSessions.map((session, index) => (
          <ThemedView
            key={session.sessionId}
            style={[
              styles.sessionItem,
              { borderBottomColor: borderColor },
              index === recentSessions.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            {/* Top Row - User Name with Status */}
            <ThemedView style={styles.topRow}>
              <ThemedText style={styles.sessionTitle}>
                {session.isActive ? "🟢 " : "🔴 "}
                {session.userName || "Unknown User"}
              </ThemedText>
            </ThemedView>

            {/* Bottom Row - Details and Button */}
            <ThemedView style={styles.bottomRow}>
              <ThemedView style={styles.sessionInfo}>
                <ThemedText style={styles.sessionDetails}>
                  {session.tripTitle || "Safety Trip"}
                </ThemedText>
                <ThemedText style={styles.sessionTime}>
                  {session.isActive ? "Started" : "Ended"}{" "}
                  {formatTimeAgo(session.receivedAt)}
                  {session.lastLocationFetch && (
                    <ThemedText style={styles.lastFetch}>
                      {" • "}Last viewed{" "}
                      {formatTimeAgo(session.lastLocationFetch)}
                    </ThemedText>
                  )}
                </ThemedText>
              </ThemedView>

              <ThemedButton
                title={
                  loadingSession === session.sessionId
                    ? "Loading..."
                    : "📍 View Location"
                }
                onPress={() =>
                  handleFetchLocation(session.sessionId, session.userName)
                }
                disabled={loadingSession === session.sessionId}
                style={[
                  styles.locationButton,
                  {
                    backgroundColor: session.isActive ? "#2196F3" : "#9E9E9E",
                    opacity: loadingSession === session.sessionId ? 0.6 : 1,
                  },
                ]}
                textStyle={styles.locationButtonText}
              />
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
      <ThemedText style={styles.helpText}>
        💡 Tap &quot;View Location&quot; to see their current locations.
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "transparent",
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  countBadge: {
    backgroundColor: "#2196F3",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: "center",
  },
  countText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  clearButton: {
    padding: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  clearButtonText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  sessionsList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  sessionItem: {
    flexDirection: "column",
    padding: 15,
    borderBottomWidth: 1,
  },
  topRow: {
    width: "100%",
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  lastFetch: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: "italic",
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignSelf: "flex-end",
  },
  locationButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  helpText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});
