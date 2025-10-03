import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Share, StyleSheet, TextInput, View } from "react-native";

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { DeepLinkService, InvitationData } from "@/services/deep-link.service";
import { useAuthStore } from "@/stores/auth/auth.store";

export default function ShareInvitationComponent() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const { user } = useAuthStore();

  const cardBackground = useThemeColor(
    {
      light: Colors.light.cardBackgroundColor,
      dark: Colors.dark.cardBackgroundColor,
    },
    "cardBackgroundColor"
  );

  const generateInvitationData = (): InvitationData => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    return {
      senderName: user.name,
      email: user.email || "",
      phone: user.phone || "",
    //   fcmToken: user.fcmToken,
      message: `${user.name} wants to add you as an emergency contact for safe travels!`,
    };
  };

  const handleShareInvitation = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "Please sign in to share invitations");
        return;
      }

      setIsSharing(true);

      const invitationData = generateInvitationData();
      const inviteLink = DeepLinkService.generateInvitationLink(invitationData);
      const webLink = DeepLinkService.generateWebLink(invitationData);

      const shareMessage = `🧳 ${user.name} wants to add you as an emergency contact for safe travels!

Download Travel Buddy app and click this link to connect:
${inviteLink}

Or open in browser:
${webLink}

Stay safe together! ✈️`;

      const shareOptions = {
        message: shareMessage,
        title: "Travel Buddy Emergency Contact Invitation",
        url: inviteLink,
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error("Error sharing invitation:", error);
      Alert.alert(
        "Error",
        "Failed to share invitation link. Please try again."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "Please sign in to generate invitation links");
        return;
      }

      const invitationData = generateInvitationData();
      const inviteLink = DeepLinkService.generateInvitationLink(invitationData);

      // For now, we'll use Share with copy option since expo-clipboard isn't installed
      await Share.share({
        message: inviteLink,
        title: "Travel Buddy Invitation Link",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      Alert.alert("Error", "Failed to copy link. Please try again.");
    }
  };

  const handleSendViaEmail = async () => {
    if (!recipientEmail.trim()) {
      Alert.alert("Error", "Please enter recipient email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      if (!user) {
        Alert.alert("Error", "Please sign in to send invitations");
        return;
      }

      setIsSharing(true);

      // For now, we'll generate the link and show it to user
      // since email service might not be fully set up
      const invitationData = generateInvitationData();
      const inviteLink = DeepLinkService.generateInvitationLink(invitationData);

      Alert.alert(
        "Email Invitation",
        `Please copy this link and send it to ${recipientEmail}:\n\n${inviteLink}`,
        [
          { text: "Cancel" },
          {
            text: "Copy Link",
            onPress: () => handleCopyLink(),
          },
        ]
      );
    } catch (error) {
      console.error("Error sending email invitation:", error);
      Alert.alert("Error", "Failed to send invitation email.");
    } finally {
      setIsSharing(false);
    }
  };

  if (!user) {
    return (
      <ThemedView
        style={[styles.container, { backgroundColor: cardBackground }]}
      >
        <ThemedText style={styles.errorText}>
          Please sign in to share invitations
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: cardBackground }]}>
      <View style={styles.header}>
        <MaterialIcons name="share" size={32} color="#4CAF50" />
        <ThemedText style={styles.title}>
          Share Emergency Contact Invitation
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Invite someone to be your emergency contact during travels
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Share</ThemedText>
        <View style={styles.buttonRow}>
          <ThemedButton
            title="Share Link"
            onPress={handleShareInvitation}
            disabled={isSharing}
            style={[styles.button, styles.shareButton]}
          />
          <ThemedButton
            title="Copy Link"
            onPress={handleCopyLink}
            disabled={isSharing}
            style={[styles.button, styles.copyButton]}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Send via Email</ThemedText>
        <ThemedText style={{ marginBottom: 4 }}>Recipient Email</ThemedText>
        <TextInput
          placeholder="Enter email address"
          value={recipientEmail}
          onChangeText={setRecipientEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.emailInput}
        />
        <ThemedButton
          title={isSharing ? "Sending..." : "Send Email Invitation"}
          onPress={handleSendViaEmail}
          disabled={isSharing || !recipientEmail.trim()}
          type="success"
          style={styles.emailButton}
        />
      </View>

      <View style={styles.infoSection}>
        <ThemedText style={styles.infoTitle}>
          Your Contact Information
        </ThemedText>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color="#666" />
          <ThemedText style={styles.infoText}>{user.name}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={16} color="#666" />
          <ThemedText style={styles.infoText}>{user.email}</ThemedText>
        </View>
        {user.phone && (
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={16} color="#666" />
            <ThemedText style={styles.infoText}>{user.phone}</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "semibold",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  shareButton: {
    backgroundColor: "#4CAF50",
  },
  copyButton: {
    backgroundColor: "#2196F3",
  },
  emailInput: {
    marginBottom: 12,
  },
  emailButton: {
    width: "100%",
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "semibold",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
  },
});
