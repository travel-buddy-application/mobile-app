import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

export interface InvitationData {
  senderName: string;
  email: string;
  phone: string;
  fcmToken?: string;
  message?: string;
}

export class DeepLinkService {
  /**
   * Generate an invitation link
   */
  static generateInvitationLink(data: InvitationData): string {
    const baseUrl =
      "https://zajzaxnkswpsdwuxpdin.supabase.co/functions/v1/deep-link";
    const params = new URLSearchParams({
      senderName: data.senderName,
      email: data.email,
      phone: data.phone,
      ...(data.fcmToken && { fcmToken: data.fcmToken }),
      ...(data.message && { message: data.message }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate a web fallback link
   */
  static generateWebLink(data: InvitationData): string {
    const baseUrl = "https://travel-buddy.app/invite";
    const params = new URLSearchParams({
      senderName: data.senderName,
      email: data.email,
      phone: data.phone,
      ...(data.fcmToken && { fcmToken: data.fcmToken }),
      ...(data.message && { message: data.message }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Parse invitation data from URL
   */
  static parseInvitationUrl(url: string): InvitationData | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const senderName = params.get("senderName");
      const email = params.get("email");
      const phone = params.get("phone");

      if (!senderName || !email || !phone) {
        return null;
      }

      return {
        senderName,
        email,
        phone,
        fcmToken: params.get("fcmToken") || undefined,
        message: params.get("message") || undefined,
      };
    } catch (error) {
      console.error("Error parsing invitation URL:", error);
      return null;
    }
  }

  /**
   * Open invitation link
   */
  static async openInvitationLink(data: InvitationData): Promise<void> {
    const deepLink = this.generateInvitationLink(data);
    const webLink = this.generateWebLink(data);

    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        // Fallback to web browser
        await WebBrowser.openBrowserAsync(webLink);
      }
    } catch (error) {
      console.error("Error opening invitation link:", error);
      // Final fallback
      await WebBrowser.openBrowserAsync(webLink);
    }
  }

  /**
   * Handle incoming deep link
   */
  static handleIncomingLink(url: string): InvitationData | null {
    return this.parseInvitationUrl(url);
  }
}
