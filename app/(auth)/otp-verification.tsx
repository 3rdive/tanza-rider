// OTPVerificationScreen.tsx
import { authService } from "@/lib/api";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants";
import { useAuthFlow } from "@/redux/hooks/hooks";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

export default function OTPVerificationScreen() {
  const { mobile, clearState, setOtp: setCode } = useAuthFlow();
  const { colors } = useTheme();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const inputRefs = useRef<any[]>([]);
  const [isLogin, setIsLogin] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      marginBottom: 20,
    },
    backArrow: {
      fontSize: rs(24),
      color: colors.text,
    },
    title: {
      fontSize: rs(28),
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
      lineHeight: rs(36),
    },
    changeNumberButton: {
      marginBottom: 40,
    },
    changeNumberText: {
      fontSize: rs(16),
      color: colors.text,
      textDecorationLine: "underline",
    },
    otpContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 10,
      marginBottom: 30,
    },
    otpInput: {
      width: 60,
      height: 60,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      fontSize: rs(24),
      fontWeight: "bold",
      textAlign: "center",
      color: colors.text,
    },
    otpInputFilled: {
      borderColor: colors.text,
      backgroundColor: colors.background,
    },
    resendButton: {
      marginBottom: 40,
    },
    resendText: {
      fontSize: rs(16),
      color: colors.textSecondary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    disabledText: {
      color: colors.textSecondary,
    },
    nextButton: {
      position: "absolute",
      bottom: 40,
      right: 24,
      backgroundColor: colors.text,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    nextText: {
      color: colors.surface,
      fontSize: rs(16),
      fontWeight: "600",
    },
    otpInputError: {
      borderColor: "#ff4444",
      backgroundColor: "#fff5f5",
    },
    otpTextError: {
      color: "#ff4444",
      fontSize: rs(14),
    },
    otpInputExpired: {
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.textSecondary,
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Handle paste or multiple digit input
    if (value.length > 1) {
      const digits = value.slice(0, 4).split("");
      const newOtp = [...otp];

      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[3]?.focus();
      }

      if (newOtp.every((digit) => digit !== "")) {
        // Auto-verify when all digits are entered
        setTimeout(async () => {
          // await consumeOtp();
        }, 500);
      }
      return;
    }

    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      // Auto-verify when all digits are entered
      setTimeout(async () => {
        // await consumeOtp();
      }, 500);
    }
  };

  const consumeOtp = async () => {
    try {
      setIsLogin(true);
      const resp = await authService.consumeOtp({
        otpType: "MOBILE",
        reference: mobile as string,
        code: otp.join(""),
      });
      if (resp.success) {
        setCode(otp?.join(""));
        router.push("/(auth)/completion");
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
    } finally {
      setIsLogin(false);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  async function resendOtp() {
    if (timer > 0 || isLogin) return;
    try {
      setError("");
      setIsLogin(true);
      await authService.sendOtp({
        otpType: "MOBILE",
        reference: mobile as string,
      });
      setTimer(60);
      setIsExpired(false);
      setOtp(["", "", "", ""]);
      (inputRefs.current[0] as any)?.focus();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to resend code. Please try again.";
      setError(msg);
    } finally {
      setIsLogin(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Enter the 4-digit code sent to you at{" "}
          {`+${DEFAULT_COUNTRY_CODE} ${mobile}`}
        </Text>

        <TouchableOpacity
          style={styles.changeNumberButton}
          onPress={() => {
            clearState();
            router.replace("/(auth)/mobile-entry");
          }}
        >
          <Text style={styles.changeNumberText}>
            Changed your mobile number?
          </Text>
        </TouchableOpacity>

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
              // maxLength={1}
              textAlign="center"
            />
          ))}
        </View>
        <Text style={styles.otpTextError}>{error}</Text>

        <TouchableOpacity
          style={[styles.resendButton, timer > 0 && styles.disabledButton]}
          disabled={timer > 0 || isLogin}
          onPress={async () => resendOtp()}
        >
          <Text
            style={[
              styles.resendText,
              (timer > 0 || isLogin) && { opacity: 0.5 },
            ]}
          >
            {timer > 0
              ? `Resend code via SMS (${formatTime(timer)})`
              : "Resend code via SMS"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !otp.every((digit) => digit !== "") && styles.disabledButton,
          ]}
          onPress={() => consumeOtp()}
          disabled={!otp.every((digit) => digit !== "")}
        >
          <Text
            style={[
              styles.nextText,
              (!otp.every((digit) => digit !== "") || isLogin) &&
                styles.disabledText,
            ]}
          >
            {isLogin ? "validating" : "Next"} →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
