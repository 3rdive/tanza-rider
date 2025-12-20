// ForgotPasswordScreen.tsx
import { authService } from "@/lib/api";
import { usePasswordResetFlow } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

export default function ForgotPasswordScreen() {
  const [mobile, setMobile] = useState("");
  const { setMobile: setResetMobile } = usePasswordResetFlow();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    if (mobile.length != 10) {
      Alert.alert("Invalid Mobile", "Please enter a valid mobile number");
      return;
    }

    try {
      const resp = await authService.sendOtp({
        otpType: "MOBILE",
        reference: mobile,
      });
      if (resp.success) {
        setResetMobile(mobile);
        router.push("/(auth)/reset_password/validate-otp");
      } else {
        Alert.alert("Failed", resp.message || "Unable to send OTP");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "An error occurred while sending OTP";
      Alert.alert("Error", msg);
    }
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
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your Mobile and we&#39;ll send you a code to reset your
            password
          </Text>
        </View>

        <View style={styles.phoneContainer}>
          <TouchableOpacity style={styles.countrySelector}>
            <Text style={styles.flag}>🇳🇬</Text>
            <Text style={styles.countryCode}>{}</Text>
            <Text style={styles.dropdown}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.phoneInput}
            placeholder="9153065907"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            mobile.length != 10 && styles.disabledButton,
          ]}
          onPress={handleSendCode}
          disabled={mobile.length != 10}
        >
          <Text
            style={[
              styles.sendText,
              mobile.length != 10 && styles.disabledText,
            ]}
          >
            Send Reset Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToSignInButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToSignInText}>
            Remember your password? Sign in
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
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: rs(24),
  },
  label: {
    fontSize: rs(16),
    color: "#000",
    marginBottom: rs(8),
    fontWeight: "500",
  },
  input: {
    borderWidth: rs(2),
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    fontSize: rs(16),
    backgroundColor: "#fff",
  },
  phoneContainer: {
    flexDirection: "row",
    marginBottom: rs(30),
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    borderRadius: rs(12),
    marginRight: rs(12),
  },
  flag: {
    fontSize: rs(20),
    marginRight: rs(8),
  },
  countryCode: {
    fontSize: rs(16),
    color: "#000",
    marginRight: rs(8),
  },
  dropdown: {
    fontSize: rs(12),
    color: "#666",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    borderRadius: rs(12),
    fontSize: rs(16),
  },
  sendButton: {
    backgroundColor: "#00B624",
    paddingVertical: rs(16),
    borderRadius: rs(12),
    alignItems: "center",
    marginBottom: rs(24),
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  sendText: {
    color: "#fff",
    fontSize: rs(18),
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
  backToSignInButton: {
    alignItems: "center",
    paddingVertical: rs(12),
    marginBottom: rs(40),
  },
  backToSignInText: {
    fontSize: rs(16),
    color: "#00B624",
    fontWeight: "500",
  },
});
