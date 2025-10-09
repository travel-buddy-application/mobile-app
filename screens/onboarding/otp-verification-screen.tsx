import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { otpEmailService } from "@/services/email.service";
import { successColor } from "@/constants/theme";

interface OTPVerificationScreenProps {
  email: string;
  userName?: string;
  onVerificationSuccess: () => void;
  onBack?: () => void;
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  email,
  userName = "User",
  onVerificationSuccess,
  onBack,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState<string>("");

  const inputRefs = useRef<TextInput[]>([]);

  const primaryColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "cardBorderColor");

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTP = useCallback(async () => {
    try {
      setIsResending(true);
      const newOTP = generateOTP();
      setGeneratedOTP(newOTP);

      await otpEmailService({
        receiverEmail: email,
        otpCode: newOTP,
        userName,
      });

      // Reset timer
      setTimer(60);
      setCanResend(false);

      Alert.alert(
        "OTP Sent",
        `A 6-digit verification code has been sent to ${email}`
      );
    } catch (error) {
      console.error("Failed to send OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  }, [email, userName]);

  // Generate and send initial OTP
  useEffect(() => {
    sendOTP();
  }, [sendOTP]);

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async () => {
    const enteredOTP = otp.join("");

    if (enteredOTP.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP against generated OTP
      if (enteredOTP === generatedOTP) {
        Alert.alert("Success", "Email verified successfully!", [
          { text: "Continue", onPress: onVerificationSuccess },
        ]);
      } else {
        Alert.alert(
          "Invalid Code",
          "The verification code you entered is incorrect. Please try again."
        );
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Verification failed:", error);
      Alert.alert("Error", "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (canResend) {
      sendOTP();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor }]}
    >
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Verify Your Email</ThemedText>

        <ThemedText style={styles.subtitle}>
          We&apos;ve sent a 6-digit verification code to
        </ThemedText>

        <ThemedText style={[styles.email, { color: primaryColor }]}>
          {email}
        </ThemedText>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                {
                  borderColor: digit ? primaryColor : borderColor,
                  color: textColor,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: successColor,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          onPress={verifyOTP}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? "Verifying..." : "Verify Email"}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <ThemedText style={styles.resendText}>
            Didn&apos;t receive the code?
          </ThemedText>

          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend || isResending}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendButtonText,
                {
                  color: canResend ? primaryColor : borderColor,
                },
              ]}
            >
              {isResending
                ? "Sending..."
                : canResend
                ? "Resend Code"
                : `Resend in ${timer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { borderColor: borderColor }]}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.backButtonText, { color: textColor }]}>
              Back to Welcome
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
    opacity: 0.8,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 40,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "100%",
    maxWidth: 300,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
  },
  verifyButton: {
    width: "100%",
    maxWidth: 300,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.7,
  },
  resendButton: {
    paddingVertical: 5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "transparent",
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
