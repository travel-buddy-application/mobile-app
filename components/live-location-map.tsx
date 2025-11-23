// Live Location Map Component for Travel Buddy
// Shows sender's location on Google Maps within the app

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { supabaseLocationService } from "@/services/supabase/location.service";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
// Conditional import for expo-maps (only available in development builds)
let GoogleMaps: any = null;
try {
  const expoMaps = require("expo-maps");
  GoogleMaps = expoMaps.GoogleMaps;
} catch {
  console.log("expo-maps not available - using fallback mode");
}

interface LiveLocationMapProps {
  visible: boolean;
  sessionId: string;
  userName: string;
  isActive: boolean;
  onClose: () => void;
}

interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

export const LiveLocationMap: React.FC<LiveLocationMapProps> = ({
  visible,
  sessionId,
  userName,
  isActive,
  onClose,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const mapRef = useRef<any>(null);
  // Theme colors
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor({}, "cardBorderColor");

  // Open external map application (fallback)
  const openExternalMap = useCallback(() => {
    if (!location) return;

    const { lat, lng } = location;
    const label = encodeURIComponent(`${userName}'s Location`);

    // Create Google Maps URL (works on both platforms)
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`; // For mobile, try to open native apps first

    if (Platform.OS === "ios") {
      const appleUrl = `http://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
      Linking.openURL(appleUrl).catch(() => {
        // Fallback to Google Maps
        Linking.openURL(googleMapsUrl);
      });
    } else {
      // Android - try Google Maps app first
      const androidUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      Linking.openURL(androidUrl).catch(() => {
        // Fallback to web Google Maps
        Linking.openURL(googleMapsUrl);
      });
    }
  }, [location, userName]);

  const fetchLocation = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        console.log("📍 Fetching location for session:", sessionId);
        const latestLocation = await supabaseLocationService.getLatestLocation(
          sessionId
        );

        if (latestLocation) {
          const locationData: LocationData = {
            lat: latestLocation.lat,
            lng: latestLocation.lng,
            timestamp: latestLocation.createdAt || new Date().toISOString(),
            accuracy: latestLocation.accuracy,
          };
          setLocation(locationData);
          setLastUpdated(new Date().toLocaleTimeString());
          setError(null);

          // Note: expo-maps doesn't support animateToRegion like react-native-maps
          // The map will automatically center on the marker when location updates
          console.log("✅ Location updated:", locationData);
        } else {
          setError(
            isActive
              ? "Location not available yet. The person may not have shared their location."
              : "Trip has ended. Location sharing is no longer active."
          );
        }
      } catch (err) {
        console.error("❌ Error fetching location:", err);
        setError("Failed to fetch location. Please check your connection.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [sessionId, isActive]
  );

  // Fetch location when modal opens
  useEffect(() => {
    if (visible && sessionId) {
      fetchLocation();
    }
  }, [visible, sessionId, fetchLocation]);

  // Auto-refresh location for active trips
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (visible && isActive && sessionId) {
      // Refresh every 30 seconds for active trips
      interval = setInterval(() => {
        fetchLocation(true); // Silent refresh
      }, 30000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [visible, isActive, sessionId, fetchLocation]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <ThemedView
          style={[
            styles.header,
            {
              backgroundColor: cardBackgroundColor,
              borderBottomColor: borderColor,
            },
          ]}
        >
          <ThemedView style={styles.headerContent}>
            <ThemedText type="subtitle" style={styles.title}>
              {isActive ? "🟢" : "🔴"} {userName}&apos;s Location
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isActive ? "Live Location Tracking" : "Trip Completed"}
            </ThemedText>
            {lastUpdated && (
              <ThemedText style={styles.lastUpdate}>
                Last updated: {lastUpdated}
              </ThemedText>
            )}
          </ThemedView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2196F3" />
              <ThemedText style={styles.loadingText}>
                Fetching location...
              </ThemedText>
            </View>
          )}
          {error && !location && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>📍 {error}</ThemedText>
              <ThemedButton
                title="Retry"
                onPress={() => fetchLocation()}
                style={styles.retryButton}
              />
            </View>
          )}
          {location && GoogleMaps && (
            <GoogleMaps.View
              ref={mapRef}
              style={styles.map}
              cameraPosition={{
                coordinates: {
                  latitude: location.lat,
                  longitude: location.lng,
                },
                zoom: 15,
              }}
              markers={[
                {
                  coordinates: {
                    latitude: location.lat,
                    longitude: location.lng,
                  },
                  title: `${userName}'s Location`,
                  snippet: `${
                    isActive ? "Live location" : "Last known location"
                  } • ${formatTimestamp(location.timestamp)}`,
                },
              ]}
              properties={{
                isMyLocationEnabled: false,
                mapType: GoogleMaps.MapType.NORMAL,
                isTrafficEnabled: true,
                isBuildingEnabled: true,
              }}
              uiSettings={{
                myLocationButtonEnabled: false,
              }}
            />
          )}
          {/* Fallback for when expo-maps is not available */}
          {location && !GoogleMaps && (
            <View style={styles.fallbackContainer}>
              <ThemedText style={styles.fallbackTitle}>
                📍 Location Available
              </ThemedText>
              <ThemedText style={styles.fallbackSubtitle}>
                Google Maps requires a development build
              </ThemedText>

              <View style={styles.coordinatesContainer}>
                <ThemedText style={styles.coordinatesLabel}>
                  Coordinates:
                </ThemedText>
                <ThemedText style={styles.coordinatesValue}>
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </ThemedText>
              </View>

              <View style={styles.fallbackActions}>
                <ThemedButton
                  title="📱 Open in Google Maps"
                  onPress={() => openExternalMap()}
                  style={styles.fallbackButton}
                  textStyle={styles.fallbackButtonText}
                />
              </View>

              <ThemedText style={styles.fallbackNote}>
                💡 To view maps in-app, create a development build with:{"\n"}
                <ThemedText style={styles.codeText}>
                  eas build --profile development
                </ThemedText>
              </ThemedText>
            </View>
          )}
        </View>

        {/* Location Info Footer */}
        {location && (
          <ThemedView
            style={[
              styles.footer,
              {
                backgroundColor: cardBackgroundColor,
                borderTopColor: borderColor,
              },
            ]}
          >
            <ThemedView style={styles.locationInfo}>
              <ThemedText style={styles.infoLabel}>Coordinates:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.locationInfo}>
              <ThemedText style={styles.infoLabel}>Last Update:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatTimestamp(location.timestamp)}
              </ThemedText>
            </ThemedView>

            {location.accuracy && (
              <ThemedView style={styles.locationInfo}>
                <ThemedText style={styles.infoLabel}>Accuracy:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  ±{Math.round(location.accuracy)}m
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.actionButtons}>
              {isActive && (
                <ThemedButton
                  title="🔄 Refresh"
                  onPress={() => fetchLocation()}
                  style={styles.refreshButton}
                  disabled={loading}
                />
              )}
              <ThemedButton
                title="Close"
                onPress={onClose}
                style={styles.closeFooterButton}
              />
            </ThemedView>
          </ThemedView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  lastUpdate: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F44336",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 15,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  locationInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: "#9E9E9E",
  },
  // Fallback styles for when expo-maps is not available
  fallbackContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  fallbackSubtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 30,
  },
  coordinatesContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
  },
  coordinatesLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  coordinatesValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  fallbackActions: {
    width: "100%",
    marginBottom: 20,
  },
  fallbackButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
  },
  fallbackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  fallbackNote: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
  codeText: {
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
