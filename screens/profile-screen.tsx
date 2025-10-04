import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuthStore, usePermissionsStore } from "@/stores";
import { UserCreateInput } from "@/types/user";
import {
  isRequired,
  isValidEmail,
  isValidPhoneNumber,
} from "@/utils/validation";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const ProfileScreen: React.FC = () => {
  const { user, updateUserProfile, logout, error, clearError } = useAuthStore();
  const {
    permissions,
    requestLocationPermission,
    requestNotificationPermission,
  } = usePermissionsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const cardBackgroundColor = useThemeColor({}, "cardBackgroundColor");
  const borderColor = useThemeColor(
    { light: Colors.light.cardBorderColor, dark: Colors.dark.cardBorderColor },
    "cardBorderColor"
  );
  const inputBackgroundColor = useThemeColor({}, "inputBackgroundColor");
  const inputBorderColor = useThemeColor({}, "inputBorderColor");
  const textColor = useThemeColor({}, "text");
  const placeholderTextColor = useThemeColor({}, "placeholderTextColor");

  const [errors, setErrors] = useState<Partial<UserCreateInput>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserCreateInput> = {};

    // Name validation
    if (!isRequired(editedUser.name)) {
      newErrors.name = "Name is required";
    } else if (editedUser.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone validation
    if (!isRequired(editedUser.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(editedUser.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Email validation
    if (!isRequired(editedUser.email)) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(editedUser.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    clearError();
    if (!validateForm()) {
      return;
    }
    try {
      await updateUserProfile(editedUser);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? This will reset the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(onboarding)/welcome");
            } catch (error) {
              console.error("Logout failed:", error);
            }
          },
        },
      ]
    );
  };

  const handleRequestLocationPermissions = async () => {
    try {
      const result = await requestLocationPermission();
      if (result) {
        Alert.alert("Permissions", "Location permission request completed!");
      } else {
        Alert.alert("Permissions", "Location permission request denied.");
      }
    } catch (error) {
      console.error("Failed to request permissions:", error);
      Alert.alert("Error", "Failed to request permissions.");
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const result = await requestNotificationPermission();
      if (result) {
        Alert.alert(
          "Permissions",
          "Notification permission request completed!"
        );
      } else {
        Alert.alert("Permissions", "Notification permission request denied.");
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      Alert.alert("Error", "Failed to request notification permission.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedView
            style={[
              styles.avatarContainer,
              { backgroundColor: cardBackgroundColor },
            ]}
          >
            <MaterialIcons name="person" size={48} color={textColor} />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            Profile
          </ThemedText>
        </ThemedView>

        {/* User Information */}
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: borderColor,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>
              Personal Information
            </ThemedText>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
            >
              <ThemedView style={styles.editButton}>
                <MaterialIcons
                  name={isEditing ? "close" : "edit"}
                  size={20}
                  color={textColor}
                />
              </ThemedView>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <ThemedView style={styles.editForm}>
              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      color: textColor,
                    },
                  ]}
                  value={editedUser.name}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, name: text })
                  }
                  placeholder="Enter your name"
                  placeholderTextColor={placeholderTextColor}
                />
                {errors.name && (
                  <ThemedText style={styles.errorText}>
                    {errors.name}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      color: textColor,
                    },
                  ]}
                  value={editedUser.phone}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, phone: text })
                  }
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={placeholderTextColor}
                />
                {errors.phone && (
                  <ThemedText style={styles.errorText}>
                    {errors.phone}
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackgroundColor,
                      borderColor: inputBorderColor,
                      color: textColor,
                    },
                  ]}
                  value={editedUser.email}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, email: text })
                  }
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={placeholderTextColor}
                />
                {errors.email && (
                  <ThemedText style={styles.errorText}>
                    {errors.email}
                  </ThemedText>
                )}
              </ThemedView>
              {error && (
                <ThemedView style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </ThemedView>
              )}

              <ThemedView style={styles.editActions}>
                <ThemedButton
                  title="Cancel"
                  onPress={handleCancelEdit}
                  style={styles.cancelButton}
                  type="default"
                />
                <ThemedButton
                  title="Save"
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                  type="success"
                />
              </ThemedView>
            </ThemedView>
          ) : (
            <ThemedView style={styles.userInfo}>
              <ThemedView style={styles.infoRow}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color={textColor}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoText}>{user?.name}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <MaterialIcons
                  name="phone"
                  size={20}
                  color={textColor}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoText}>{user?.phone}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.infoRow}>
                <MaterialIcons
                  name="email"
                  size={20}
                  color={textColor}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoText}>{user?.email}</ThemedText>
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>

        {/* Permissions */}
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: borderColor,
            },
          ]}
        >
          <ThemedText style={styles.cardTitle}>App Permissions</ThemedText>

          <ThemedView style={styles.permissionItem}>
            <ThemedView style={styles.permissionInfo}>
              <MaterialIcons
                name="location-on"
                size={20}
                color={textColor}
                style={styles.permissionIcon}
              />
              <ThemedView>
                <ThemedText style={styles.permissionTitle}>Location</ThemedText>
                <ThemedText style={styles.permissionSubtitle}>
                  For safety monitoring and emergency services
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={permissions.location}
              onValueChange={handleRequestLocationPermissions}
              trackColor={{ false: "#767577", true: "#4CAF50" }}
              thumbColor={permissions.location ? "#ffffff" : "#f4f3f4"}
            />
          </ThemedView>

          <ThemedView style={styles.permissionItem}>
            <ThemedView style={styles.permissionInfo}>
              <MaterialIcons
                name="notifications"
                size={20}
                color={textColor}
                style={styles.permissionIcon}
              />
              <ThemedView>
                <ThemedText style={styles.permissionTitle}>
                  Notifications
                </ThemedText>
                <ThemedText style={styles.permissionSubtitle}>
                  For safety alerts and emergency notifications
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={permissions.notifications}
              onValueChange={handleRequestNotificationPermission}
              trackColor={{ false: "#767577", true: "#4CAF50" }}
              thumbColor={permissions.notifications ? "#ffffff" : "#f4f3f4"}
            />
          </ThemedView>
        </ThemedView>

        {/* App Actions */}
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: borderColor,
            },
          ]}
        >
          <ThemedText style={styles.cardTitle}>App Settings</ThemedText>

          <ThemedButton
            title="🔄 Reset App Data"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </ThemedView>

        {/* App Info */}
        <ThemedView style={styles.appInfo}>
          <ThemedText style={styles.appInfoText}>
            Travel Buddy v1.0.0
          </ThemedText>
          <ThemedText style={styles.appInfoText}>
            Stay safe on your journeys
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  editButton: {
    padding: 6,
    borderRadius: 8,
  },
  userInfo: {
    gap: 12,
    padding: 6,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  infoText: {
    fontSize: 16,
  },
  editForm: {
    gap: 15,
    padding: 10,
    borderRadius: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "semibold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  permissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    borderRadius: 8,
  },
  permissionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  permissionIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: "semibold",
  },
  permissionSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    maxWidth: 200,
  },
  logoutButton: {
    backgroundColor: "#F44336",
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  appInfo: {
    alignItems: "center",
    marginTop: 20,
    opacity: 0.5,
  },
  appInfoText: {
    fontSize: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#ff4757",
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: "#fff5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});
