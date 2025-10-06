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
import { Alert } from "react-native";

export interface FCMNotificationData {
  type?:
    | "emergency"
    | "location_share"
    | "trip_update"
    | "accept_contact_request";
  tripId?: string;
  contactId?: string;
  userId?: string;
  action?: string;
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
