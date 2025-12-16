import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { successColor, errorColor } from "@/constants/theme";

interface StationaryAlertModalProps {
  visible: boolean;
  onOkay: () => void;
  onSOS: () => void;
}

export const StationaryAlertModal: React.FC<StationaryAlertModalProps> = ({
  visible,
  onOkay,
  onSOS,
}) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!visible) return;

    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onSOS]);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Are you okay?
          </Text>
          <Text style={[styles.message, { color: textColor }]}>
            You&apos;ve been stationary for 5 minitues.
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: successColor }]}
              onPress={onOkay}
            >
              <Text style={styles.buttonText}>I&apos;m okay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: errorColor }]}
              onPress={onSOS}
            >
              <Text style={styles.buttonText}>SOS ({countdown})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
