import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { InvitationData } from "@/services/deep-link.service";
import { useAuthStore } from "@/stores/auth/auth.store";
import { useContactStore } from "@/stores/contact/contact.store";

export default function InviteAcceptScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();
  const { addContact, contacts } = useContactStore();
  const [accepted, setAccepted] = useState(false);

  // Memoize invitation data to prevent re-parsing on every render
  const invitationData = useMemo<InvitationData | null>(() => {
    if (params.senderName && params.email && params.phone) {
      return {
        senderName: params.senderName as string,
        email: params.email as string,
        phone: params.phone as string,
        fcmToken: (params.fcmToken as string) || undefined,
        message: (params.message as string) || undefined,
        receiverEmail: (params.receiverEmail as string) || "",
      };
    }
    return null;
  }, [
    params.senderName,
    params.email,
    params.phone,
    params.fcmToken,
    params.message,
    params.receiverEmail,
  ]);

  // Check if the invitation is valid
  const invitationStatus = useMemo(() => {
    if (!invitationData) {
      return { type: "invalid", message: "Invalid invitation data" };
    }

    // Check if receiver email matches current user's email
    if (
      invitationData.receiverEmail &&
      user?.email &&
      invitationData.receiverEmail !== user.email
    ) {
      return {
        type: "wrong_recipient",
        message: `This invitation is for ${invitationData.receiverEmail}, but you are logged in as ${user.email}`,
      };
    }

    // Check if sender is already in contacts
    const existingContact = contacts.find(
      (contact) =>
        contact.email === invitationData.email ||
        contact.phone === invitationData.phone
    );

    if (existingContact && !accepted) {
      return {
        type: "already_exists",
        message: `${invitationData.senderName} is already in your emergency contacts`,
        contactName: existingContact.displayName,
      };
    }

    return { type: "valid" };
  }, [invitationData, user?.email, contacts]);

  // Memoize theme colors to prevent recalculation
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    "background"
  );

  const cardBackground = useThemeColor(
    {
      light: Colors.light.cardBackgroundColor,
      dark: Colors.dark.cardBackgroundColor,
    },
    "cardBackgroundColor"
  );

  // Use useCallback to prevent function recreation on every render
  const handleAcceptInvitation = useCallback(async () => {
    if (!invitationData) {
      Alert.alert("Error", "Invalid invitation data");
      return;
    }

    setIsLoading(true);

    try {
      setAccepted(true);
      await addContact({
        displayName: invitationData.senderName,
        email: invitationData.email,
        phone: invitationData.phone,
        sharingPolicy: "all",
        pushToken: invitationData.fcmToken,
      });

      Alert.alert(
        "Success!",
        `${invitationData.senderName} has been added to your emergency contacts.`,
        [
          {
            text: "View Contacts",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert("Error", "Failed to accept invitation. Please try again.", [
        { text: "OK" },
        { text: "Retry", onPress: handleAcceptInvitation },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [invitationData, addContact]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this invitation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  }, []);

  const handleGoHome = useCallback(() => {
    router.back();
  }, []);

  // Handle invalid invitation
  if (!invitationData || invitationStatus.type === "invalid") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ff6b6b" />
          <ThemedText style={styles.errorTitle}>Invalid Invitation</ThemedText>
          <ThemedText style={styles.errorMessage}>
            This invitation link is invalid or has expired.
          </ThemedText>
          <ThemedButton
            title="Go Home"
            onPress={handleGoHome}
            style={styles.button}
            type="success"
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Handle wrong recipient
  if (invitationStatus.type === "wrong_recipient") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="person-off" size={64} color="#ff9800" />
          <ThemedText style={styles.errorTitle}>Wrong Recipient</ThemedText>
          <ThemedText style={styles.errorMessage}>
            {invitationStatus.message}
          </ThemedText>
          <ThemedText style={styles.errorMessage}>
            Please make sure you&apos;re logged in with the correct email
            address or contact the sender.
          </ThemedText>
          <ThemedButton
            title="Go Home"
            onPress={handleGoHome}
            style={styles.button}
            type="success"
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Handle contact already exists
  if (invitationStatus.type === "already_exists") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="person-add-disabled" size={64} color="#2196F3" />
          <ThemedText style={styles.errorTitle}>Already Connected</ThemedText>
          <ThemedText style={styles.errorMessage}>
            {invitationStatus.message}
          </ThemedText>
          <ThemedText style={styles.errorMessage}>
            {invitationData.senderName} is already listed as &quot;
            {invitationStatus.contactName}&quot; in your emergency contacts.
          </ThemedText>
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="View Contacts"
              onPress={() => router.push("/(tabs)/contacts")}
              style={styles.button}
              type="success"
            />
            <ThemedButton
              title="Go Home"
              onPress={handleGoHome}
              style={styles.button}
            />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!invitationData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#ff6b6b" />
          <ThemedText style={styles.errorTitle}>Invalid Invitation</ThemedText>
          <ThemedText style={styles.errorMessage}>
            This invitation link is invalid or has expired.
          </ThemedText>
          <ThemedButton
            title="Go Home"
            onPress={handleGoHome}
            style={styles.button}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="person-add" size={64} color="#4CAF50" />
            <ThemedText style={styles.title}>
              Travel Buddy Invitation
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              You&apos;ve been invited to join as an emergency contact
            </ThemedText>
          </View>

          {/* Invitation Card */}
          <ThemedView
            style={[styles.invitationCard, { backgroundColor: cardBackground }]}
          >
            <View style={styles.senderInfo}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="person" size={40} color="#666" />
              </View>
              <View style={styles.senderDetails}>
                <ThemedText style={styles.senderName}>
                  {invitationData.senderName}
                </ThemedText>
                <ThemedText style={styles.senderEmail}>
                  {invitationData.email}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactInfo}>
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#666" />
                <ThemedText style={styles.infoText}>
                  {invitationData.email}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color="#666" />
                <ThemedText style={styles.infoText}>
                  {invitationData.phone}
                </ThemedText>
              </View>
              {invitationData.fcmToken && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="notifications"
                    size={20}
                    color="#4CAF50"
                  />
                  <ThemedText style={styles.infoText}>
                    Push notifications enabled
                  </ThemedText>
                </View>
              )}
            </View>

            {invitationData.message && (
              <>
                <View style={styles.divider} />
                <View style={styles.messageContainer}>
                  <ThemedText style={styles.messageLabel}>Message:</ThemedText>
                  <ThemedText style={styles.messageText}>
                    {invitationData.message}
                  </ThemedText>
                </View>
              </>
            )}
          </ThemedView>

          {/* Benefits Section */}
          <ThemedView
            style={[styles.benefitsCard, { backgroundColor: cardBackground }]}
          >
            <ThemedText style={styles.benefitsTitle}>
              What does this mean?
            </ThemedText>
            <View style={styles.benefitItem}>
              <MaterialIcons name="security" size={24} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>
                You&apos;ll be notified in case of emergencies during their
                travels
              </ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="location-on" size={24} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>
                You can track their location when shared
              </ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="chat" size={24} color="#4CAF50" />
              <ThemedText style={styles.benefitText}>
                Direct communication during trips
              </ThemedText>
            </View>
          </ThemedView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <ThemedButton
              title={isLoading ? "Adding Contact..." : "Accept Invitation"}
              onPress={handleAcceptInvitation}
              disabled={isLoading}
              type="success"
              style={styles.acceptButton}
            />
            <ThemedButton
              title="Decline"
              onPress={handleDecline}
              type="delete"
              style={styles.declineButton}
            />
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
  },
  invitationCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  senderEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  contactInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  messageContainer: {
    marginTop: 8,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
  },
  benefitsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  acceptButton: {
    marginBottom: 12,
  },
  declineButton: {
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 20,
  },
});