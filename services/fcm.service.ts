import { useContactStore } from "@/stores/contact/contact.store";
import {
  AuthorizationStatus,
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  subscribeToTopic,
  unsubscribeFromTopic,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Alert, Linking, Platform } from "react-native";

export interface FCMNotificationData {
  // Legacy type-based notifications
  type?:
    | "emergency"
    | "location_share"
    | "trip_update"
    | "accept_contact_request"
    | "location_update"
    | "open_maps"
    | "trip_started_with_session"
    | "trip_ended_with_session";
  // Common fields
  tripId?: string;
  contactId?: string;
  userId?: string;
  sessionId?: string;
  userName?: string;
  title?: string;
  body?: string;

  // Contact request fields
  senderEmail?: string;
  senderFcmToken?: string;
  senderPushToken?: string;

  // Location data for opening in Google Maps
  latitude?: string;
  longitude?: string;
  locationName?: string;

  // Action-based location fields (cleaner naming)
  lat?: string;
  lng?: string;
  label?: string;

  [key: string]: string | undefined;
}
const { updateContactByEmail } = useContactStore.getState();

export class FCMService {
  private static instance: FCMService;
  private isInitialized = false;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure notification settings
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permission for notifications
      await this.requestPermission();

      // Set up message handlers
      this.setupMessageHandlers();

      // Handle background notification taps
      this.setupBackgroundMessageHandler();

      this.isInitialized = true;
      console.log("🔔 FCM Service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize FCM Service:", error);
    }
  }

  private async requestPermission(): Promise<boolean> {
    try {
      const messaging = getMessaging();
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn("⚠️ FCM permission not granted");
        return false;
      }

      console.log("✅ FCM permission granted");
      return true;
    } catch (error) {
      console.error("❌ Error requesting FCM permission:", error);
      return false;
    }
  }

  private setupMessageHandlers(): void {
    const messaging = getMessaging();

    // Handle foreground messages
    onMessage(
      messaging,
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log("📨 Foreground message received:", remoteMessage);
        await this.handleForegroundMessage(remoteMessage);
      }
    );

    // Handle notification opened from background/quit state
    onNotificationOpenedApp(
      messaging,
      (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log("📲 Notification opened from background:", remoteMessage);
        this.handleNotificationPress(remoteMessage);
      }
    );

    // Handle notification opened from quit state
    getInitialNotification(messaging).then(
      (remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          console.log("📲 Notification opened from quit state:", remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      }
    );
  }

  private setupBackgroundMessageHandler(): void {
    const messaging = getMessaging();
    setBackgroundMessageHandler(
      messaging,
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log("📨 Background message received:", remoteMessage);
        await this.handleBackgroundMessage(remoteMessage);
      }
    );
  }

  private async handleForegroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    const { data, notification } = remoteMessage;
    console.log("Processing foreground message:", remoteMessage);
    const notificationData = data as FCMNotificationData;

    // Handle other notification types
    switch (notificationData.type) {
      case "accept_contact_request":
        if (notificationData.senderEmail) {
          updateContactByEmail(notificationData.senderEmail, {
            status: "accepted",
            pushToken: notificationData.senderFcmToken,
          });
        }
        break;
      case "trip_started_with_session":
        this.handleTripStartedWithSession(notificationData);
        break;
      case "trip_ended_with_session":
        this.handleTripEndedWithSession(notificationData);
        break;
    }

    try {
      // Show local notification using expo-notifications for non-location notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification?.title || "Travel Buddy",
          body: notification?.body || "New notification",
          data: data as Record<string, string>,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      // Handle action-based notifications (modern approach)
      if (notificationData.type === "open_maps") {
        Alert.alert(
          "🗺️ Open Location",
          notification?.body || "Open location in maps?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Maps",
              onPress: async () => {
                if (notificationData.lat && notificationData.lng) {
                  await this.openMaps(
                    notificationData.lat,
                    notificationData.lng,
                    notificationData.label
                  );
                } else {
                  Alert.alert("Error", "Location data is missing or invalid.");
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("❌ Error handling foreground message:", error);
    }
  }

  private async handleBackgroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    console.log("Processing background message:", remoteMessage);
    const { data } = remoteMessage;
    const notificationData = data as FCMNotificationData;
    switch (notificationData.type) {
      case "accept_contact_request":
        if (notificationData.senderEmail) {
          updateContactByEmail(notificationData.senderEmail, {
            status: "accepted",
            pushToken: notificationData.senderPushToken,
          });
        }
        break;
      case "trip_ended_with_session":
        this.handleTripEndedWithSession(notificationData);
        break;
    }
    // Handle background processing if needed
    // This runs when app is in background or killed
  }
  private handleNotificationPress(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const { data } = remoteMessage;
    const notificationData = data as FCMNotificationData;
    console.log("Handling notification press with data:", notificationData);

    try {
      // Handle action-based notifications (modern approach)
      if (
        notificationData.type === "open_maps" &&
        notificationData.lat &&
        notificationData.lng
      ) {
        this.openMaps(
          notificationData.lat,
          notificationData.lng,
          notificationData.label
        );
        return;
      }

      // Handle type-based notifications (legacy approach)
      switch (notificationData.type) {
        case "emergency":
          this.navigateToEmergency(notificationData);
          break;
        case "location_share":
          this.navigateToLocationShare(notificationData);
          break;
        case "trip_update":
          this.navigateToTrip(notificationData);
          break;
        case "accept_contact_request":
          this.navigateToContactRequest(notificationData);
          break;
        case "location_update":
          this.openLocationInGoogleMaps(notificationData);
          break;
        case "trip_started_with_session":
          this.handleTripStartedWithSession(notificationData);
          break;
        default:
          // Navigate to home or appropriate default screen
          router.push("/(tabs)");
          break;
      }
    } catch (error) {
      console.error("❌ Error handling notification press:", error);
      router.push("/(tabs)");
    }
  }

  private navigateToEmergency(data: FCMNotificationData): void {
    if (data.tripId) {
      router.push(`/?tripId=${data.tripId}&action=emergency` as any);
    } else {
      router.push("/(tabs)");
    }
  }
  private navigateToLocationShare(data: FCMNotificationData): void {
    // If location coordinates are provided, open in Google Maps
    if (data.latitude && data.longitude) {
      this.openLocationInGoogleMaps(data);
      return;
    }

    // Otherwise, navigate to app with contact info
    if (data.contactId) {
      router.push(`/?contactId=${data.contactId}&action=location` as any);
    } else {
      router.push("/(tabs)");
    }
  }

  private navigateToTrip(data: FCMNotificationData): void {
    if (data.tripId) {
      router.push(`/?tripId=${data.tripId}` as any);
    } else {
      router.push("/(tabs)");
    }
  }
  private navigateToContactRequest(data: FCMNotificationData): void {
    router.push("/(tabs)/contacts");
  }
  private buildMapsUrls(lat: string, lng: string, label?: string) {
    // Universal web link (works everywhere)
    const googleWeb = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${
      label ? `&query_place_id=${encodeURIComponent(label)}` : ""
    }`;

    // Android intents (prefer the app)
    const androidGeo = `geo:${lat},${lng}?q=${lat},${lng}${
      label ? `(${encodeURIComponent(label)})` : ""
    }`;
    const androidNav = `google.navigation:q=${lat},${lng}`;

    // iOS Google Maps URL scheme
    const iosGmaps = `comgooglemaps://?q=${lat},${lng}${
      label ? `(${encodeURIComponent(label)})` : ""
    }&zoom=16`;

    // iOS Apple Maps fallback
    const iosApple = `http://maps.apple.com/?ll=${lat},${lng}${
      label ? `&q=${encodeURIComponent(label)}` : ""
    }`;

    return { googleWeb, androidGeo, androidNav, iosGmaps, iosApple };
  }

  private async openMaps(
    lat: string,
    lng: string,
    label?: string
  ): Promise<void> {
    const { googleWeb, androidGeo, androidNav, iosGmaps, iosApple } =
      this.buildMapsUrls(lat, lng, label);

    console.log("🌐 Maps URLs:", {
      googleWeb,
      androidGeo,
      androidNav,
      iosGmaps,
      iosApple,
    });

    try {
      if (Platform.OS === "android") {
        console.log("🌐 Platform is Android");
        // Prefer navigation if you want turn-by-turn, then geo, then web
        const candidates = [androidNav, androidGeo, googleWeb];
        for (const url of candidates) {
          console.log(`🔗 Trying URL: ${url}`);
          if (await Linking.canOpenURL(url)) {
            console.log(`🗺️ Opening maps with: ${url}`);
            return await Linking.openURL(url);
          }
        }
      } else {
        // iOS: Try Google Maps app, then Apple Maps, then web
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
      // Fallback to web URL
      await Linking.openURL(googleWeb);
    }
  }

  private async openLocationInGoogleMaps(
    data: FCMNotificationData
  ): Promise<void> {
    const { latitude, longitude, locationName } = data;

    if (!latitude || !longitude) {
      console.error("❌ Missing latitude or longitude in notification data");
      Alert.alert(
        "Location Error",
        "Cannot open location - coordinates not available",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates");
      }

      console.log(`🗺️ Opening location in maps: ${lat}, ${lng}`);
      await this.openMaps(latitude, longitude, locationName);
    } catch (error) {
      console.error("❌ Error opening location in Google Maps:", error);

      // Show fallback alert with coordinates
      Alert.alert(
        "Location Information",
        `Location: ${latitude}, ${longitude}${
          locationName ? `\nName: ${locationName}` : ""
        }`,
        [
          {
            text: "Copy Coordinates",
            onPress: () => {
              console.log(`Coordinates: ${latitude}, ${longitude}`);
            },
          },
          { text: "OK" },
        ]
      );
    }
  }
  private handleTripStartedWithSession(data: FCMNotificationData): void {
    console.log("🚀 Handling trip started with session notification:", data);

    // Store the received session for later access
    if (data.sessionId && data.userId) {
      // Dynamic import to avoid circular dependencies
      import("@/stores/received-trips/received-trips.store").then(
        ({ useReceivedTripsStore }) => {
          useReceivedTripsStore.getState().addReceivedSession({
            sessionId: data.sessionId!,
            userId: data.userId!,
            userName: data.userName,
            tripTitle: data.title || "Safety Trip",
          });
        }
      );
    }

    // Show alert with option to view live location
    Alert.alert(
      "🚀 Trip Started",
      data.body ||
        `${
          data.userName || "Someone"
        } has started a safety trip. You can view their live location anytime.`,
      [
        { text: "OK", style: "default" },
        {
          text: "View Live Location",
          onPress: async () => {
            if (data.sessionId && data.userId) {
              await this.fetchAndOpenLatestLocation(
                data.sessionId,
                data.userName
              );
            } else {
              Alert.alert(
                "Error",
                "Cannot view location - session information missing"
              );
            }
          },
        },
      ]
    );
  }

  private handleTripEndedWithSession(data: FCMNotificationData): void {
    console.log("🏁 Handling trip ended with session notification:", data);

    // Mark the received session as inactive
    if (data.sessionId && data.userId) {
      // Dynamic import to avoid circular dependencies
      import("@/stores/received-trips/received-trips.store").then(
        ({ useReceivedTripsStore }) => {
          useReceivedTripsStore.getState().markSessionInactive(data.sessionId!);
          console.log("🔴 Marked session as inactive:", data.sessionId);
        }
      );
    }

    // Show notification that trip has ended
    Alert.alert(
      "🏁 Trip Ended",
      data.body ||
        `${
          data.userName || "Someone"
        } has safely completed their trip. You can no longer view their live location.`,
      [{ text: "OK", style: "default" }]
    );
  }

  private async fetchAndOpenLatestLocation(
    sessionId: string,
    userName?: string
  ): Promise<void> {
    try {
      console.log("📍 Fetching latest location for session:", sessionId);
      // Dynamic import to avoid circular dependencies
      const { supabaseLocationService } = await import(
        "@/services/supabase/location.service"
      );

      const latestLocation = await supabaseLocationService.getLatestLocation(
        sessionId
      );

      if (latestLocation) {
        console.log("✅ Latest location found, opening in maps");
        await this.openMaps(
          latestLocation.lat.toString(),
          latestLocation.lng.toString(),
          `${userName || "Safety Trip"} - Live Location`
        );
      } else {
        Alert.alert(
          "No Location Available",
          `${
            userName || "The person"
          } hasn't shared their location yet. Please try again later.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("❌ Error fetching latest location:", error);
      Alert.alert(
        "Error",
        "Failed to fetch location. Please try again later.",
        [{ text: "OK" }]
      );
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const messaging = getMessaging();
      const token = await getToken(messaging);
      console.log("🔑 FCM Token:", token);
      return token;
    } catch (error) {
      console.error("❌ Error getting FCM token:", error);
      return null;
    }
  }

  onTokenRefresh(callback: (token: string) => void): () => void {
    const messaging = getMessaging();
    return onTokenRefresh(messaging, callback);
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      const messaging = getMessaging();
      await subscribeToTopic(messaging, topic);
      console.log(`✅ Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Error subscribing to topic ${topic}:`, error);
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      const messaging = getMessaging();
      await unsubscribeFromTopic(messaging, topic);
      console.log(`✅ Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Error unsubscribing from topic ${topic}:`, error);
    }
  }
}

export const fcmService = FCMService.getInstance();
