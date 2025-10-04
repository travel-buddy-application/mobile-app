import { DeepLinkService, InvitationData } from "@/services/deep-link.service";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

export const useDeepLinking = () => {
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [pendingInvitation, setPendingInvitation] =
    useState<InvitationData | null>(null);

  useEffect(() => {
    // Handle initial URL when app is opened from a cold start
    const getInitialUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          setInitialUrl(url);
          handleDeepLink(url);
        }
      } catch (error) {
        console.error("Error getting initial URL:", error);
      }
    };

    // Handle URLs when app is already running
    const handleUrlChange = (event: { url: string }) => {
      handleDeepLink(event.url);
    };

    const subscription = Linking.addEventListener("url", handleUrlChange);
    getInitialUrl();

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log("Handling deep link:", url);

    // Check if it's an invitation link
    if (url.includes("/invite") || url.includes("invite")) {
      const invitationData = DeepLinkService.parseInvitationUrl(url);

      if (invitationData) {
        setPendingInvitation(invitationData);

        // Navigate to invitation screen with params
        const params = new URLSearchParams({
          senderName: invitationData.senderName,
          email: invitationData.email,
          phone: invitationData.phone,
          ...(invitationData.fcmToken && { fcmToken: invitationData.fcmToken }),
          ...(invitationData.message && { message: invitationData.message }),
        });

        router.push(`/invite?${params.toString()}`);
      }
    }
  };

  const clearPendingInvitation = () => {
    setPendingInvitation(null);
  };

  return {
    initialUrl,
    pendingInvitation,
    clearPendingInvitation,
    handleDeepLink,
  };
};
