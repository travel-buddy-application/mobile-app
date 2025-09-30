import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import AddContactPerson from "@/screens/add-contact-person";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddContactScreen() {
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    "background"
  );

  const handleAddContact = (contact: {
    name: string;
    email: string;
    phone: string;
  }) => {
    console.log("New contact:", contact);
    // Handle adding contact logic here
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      <View style={styles.content}>
        <AddContactPerson onAdd={handleAddContact} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
