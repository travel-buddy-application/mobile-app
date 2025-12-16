import AddContactForm from "@/components/emergencyContacts/add-contact-form";
import { ContactCard } from "@/components/emergencyContacts/contact-card";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useContactStore } from "@/stores";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const ContactsScreen: React.FC = () => {
  const { contacts, setShowAddForm, showAddForm } = useContactStore();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Emergency Contacts
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage your trusted contacts for emergencies
          </ThemedText>
        </ThemedView>

        <ThemedButton
          title="+ Add Emergency Contact"
          onPress={() => setShowAddForm(true)}
          style={styles.addButton}
          textStyle={styles.addButtonText}
          type="add"
        />

        {showAddForm && (
          <ThemedView style={styles.formContainer}>
            <AddContactForm />
          </ThemedView>
        )}

        {contacts.length > 0 ? (
          <ThemedView style={styles.contactsList}>
            {contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </ThemedView>
        ) : (
          <ThemedView style={styles.emptyState}>
            <MaterialIcons
              name="contacts"
              size={64}
              color={textColor}
              style={styles.emptyIcon}
            />
            <ThemedText style={styles.emptyTitle}>
              No Emergency Contacts
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Add trusted contacts who will be notified in case of emergencies
            </ThemedText>
          </ThemedView>
        )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 20,
  },
  contactsList: {
    gap: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    maxWidth: 280,
  },
});
