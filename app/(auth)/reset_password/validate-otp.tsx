// ResetOTPScreen.tsx
import { authService } from "@/lib/api";
import { usePasswordResetFlow } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

export default function ValidateOtp() {
  const { mobile, setOtp: setResetOtp } = usePasswordResetFlow();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<React.Ref<TextInput>[]>([]);

  useEffect(() => {
    if (!mobile) {
      router.back();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    setError(""); // Clear any previous errors
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      (inputRefs.current[index + 1] as any).focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every((digit) => digit !== "")) {
      setTimeout(() => {
        verifyOTP(newOtp.join(""));
      }, 500);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      (inputRefs.current[index - 1] as any).focus();
    }
  };

  const verifyOTP = async (otpCode: string) => {
    if (isExpired) {
      setError("Code has expired. Please request a new one.");
      return;
    }

    try {
      const resp = await authService.consumeOtp({
        otpType: "MOBILE",
        reference: mobile as string,
        code: otpCode,
      });
      if (resp.success) {
        setResetOtp(otpCode);
        router.push("/(auth)/reset_password/new-password-screen");
      } else {
        setError(resp.message || "Invalid code. Please try again.");
        setOtp(["", "", "", ""]);
        (inputRefs.current[0] as any).focus();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Invalid code. Please try again.";
      setError(msg);
      if (msg?.toLowerCase().includes("expired")) {
        setIsExpired(true);
      }
      setOtp(["", "", "", ""]);
      (inputRefs.current[0] as any).focus();
    }
  };

  const handleResendCode = () => {
    if (timer > 0) return;

    setTimer(60);
    setIsExpired(false);
    setError("");
    setOtp(["", "", "", ""]);
    Alert.alert(
      "Code Sent",
      "A new verification code has been sent to your email."
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 4-digit code to {mobile}
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref as any)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
                isExpired && styles.otpInputExpired,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              editable={!isExpired}
            />
          ))}
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Expired Message */}
        {isExpired && (
          <Text style={styles.expiredText}>
            Code has expired. Please request a new one.
          </Text>
        )}

        {/* Timer and Resend */}
        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in {formatTime(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.changeEmailButton}
          onPress={() => router.back()}
        >
          <Text style={styles.changeEmailText}>
            Wrong phone number? Change it
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: rs(24),
    paddingTop: rs(20),
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    justifyContent: "center",
    marginBottom: rs(20),
  },
  backArrow: {
    fontSize: rs(24),
    color: "#000",
  },
  header: {
    marginBottom: rs(40),
  },
  title: {
    fontSize: rs(28),
    fontWeight: "bold",
    color: "#000",
    marginBottom: rs(12),
  },
  subtitle: {
    fontSize: rs(16),
    color: "#666",
    lineHeight: rs(22),
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: rs(20),
    gap: rs(12),
  },
  otpInput: {
    width: rs(60),
    height: rs(60),
    borderWidth: rs(2),
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    fontSize: rs(24),
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  otpInputFilled: {
    borderColor: "#00B624",
    backgroundColor: "#f0fffe",
  },
  otpInputError: {
    borderColor: "#ff4444",
    backgroundColor: "#fff5f5",
  },
  otpInputExpired: {
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  errorText: {
    fontSize: rs(14),
    color: "#ff4444",
    textAlign: "center",
    marginBottom: rs(20),
  },
  expiredText: {
    fontSize: rs(14),
    color: "#ff6600",
    textAlign: "center",
    marginBottom: rs(20),
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: rs(30),
  },
  timerText: {
    fontSize: rs(16),
    color: "#666",
  },
  resendText: {
    fontSize: rs(16),
    color: "#00B624",
    fontWeight: "600",
  },
  changeEmailButton: {
    alignItems: "center",
    paddingVertical: rs(12),
  },
  changeEmailText: {
    fontSize: rs(16),
    color: "#00B624",
    fontWeight: "500",
  },
});
