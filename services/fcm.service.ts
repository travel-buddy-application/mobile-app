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
  type?:
    | "emergency"
    | "location_share"
    | "trip_update"
    | "accept_contact_request"
    | "location_update";
  tripId?: string;
  contactId?: string;
  userId?: string;
  action?: string;
  // Location data for opening in Google Maps
  latitude?: string;
  longitude?: string;
  locationName?: string;
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
    const { notification, data } = remoteMessage;
    const notificationData = data as FCMNotificationData;

    if (!notification) return;

    try {
      // Show local notification using expo-notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Travel Buddy",
          body: notification.body || "New notification",
          data: data as Record<string, string>,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      // Show alert for emergency notifications
      if (data?.type === "emergency") {
        Alert.alert(
          "🚨 Emergency Alert",
          notification.body || "Emergency notification received",
          [
            { text: "Dismiss", style: "cancel" },
            {
              text: "View Details",
              onPress: () => this.handleNotificationPress(remoteMessage),
            },
          ]
        );
      }
      switch (notificationData.type) {
        case "accept_contact_request":
          if (notificationData.senderEmail) {
            updateContactByEmail(notificationData.senderEmail, {
              status: "accepted",
              pushToken: notificationData.senderFcmToken,
            });
          }
          break;
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
    }
    // Handle background processing if needed
    // This runs when app is in background or killed
  }

  private handleNotificationPress(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const { data } = remoteMessage;
    const notificationData = data as FCMNotificationData;

    try {
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

      // Create Google Maps URL with coordinates
      let googleMapsUrl: string;

      if (Platform.OS === "ios") {
        // iOS: Try Google Maps app first, fall back to Apple Maps
        googleMapsUrl = `comgooglemaps://?center=${lat},${lng}&zoom=15&views=traffic`;

        const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
        if (!canOpenGoogleMaps) {
          // Fall back to Apple Maps if Google Maps not installed
          googleMapsUrl = `http://maps.apple.com/?ll=${lat},${lng}&z=15`;
        }
      } else {
        // Android: Use Google Maps with geo: URI or web fallback
        googleMapsUrl = `geo:${lat},${lng}?z=15`;

        const canOpenGeoUri = await Linking.canOpenURL(googleMapsUrl);
        if (!canOpenGeoUri) {
          // Fall back to web Google Maps
          googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
        }
      }

      // Add location name as query parameter if available
      if (locationName) {
        const encodedName = encodeURIComponent(locationName);
        if (googleMapsUrl.includes("google.com")) {
          googleMapsUrl += `&query=${encodedName}`;
        }
      }

      console.log(`🗺️ Opening location in maps: ${lat}, ${lng}`);
      console.log(`🔗 Maps URL: ${googleMapsUrl}`);

      await Linking.openURL(googleMapsUrl);
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
              // You could implement clipboard functionality here if needed
              console.log(`Coordinates: ${latitude}, ${longitude}`);
            },
          },
          { text: "OK" },
        ]
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
