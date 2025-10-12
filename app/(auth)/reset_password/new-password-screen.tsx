// NewPasswordScreen.tsx
import { authService } from "@/lib/api";
import { usePasswordResetFlow } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

export default function NewPasswordScreen() {
  const { otp, mobile } = usePasswordResetFlow();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isPasswordValid && doPasswordsMatch;

  useEffect(() => {
    if (!otp) {
      router.back();
    }
  }, []);

  const handleResetPassword = async () => {
    if (!isFormValid) {
      Alert.alert(
        "Invalid Password",
        "Please check your password requirements"
      );
      return;
    }

    try {
      const resp = await authService.resetPassword({
        password,
        reference: mobile as string,
        code: otp as string,
      });
      if (resp.success) {
        Alert.alert(
          "Password Reset Successful",
          resp.message ||
            "Your password has been reset successfully. You can now sign in with your new password.",
          [
            {
              text: "Sign In",
              onPress: () => router.replace("/(auth)/sign-in"),
            },
          ]
        );
      } else {
        Alert.alert("Failed", resp.message || "Unable to reset password");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "An error occurred while resetting password";
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
          <Text style={styles.title}>Create new password</Text>
          <Text style={styles.subtitle}>
            Create a strong password for {mobile}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  password && !isPasswordValid && styles.errorInput,
                ]}
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[
                styles.helperText,
                password && !isPasswordValid && styles.errorHelperText,
              ]}
            >
              Minimum 6 characters
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  confirmPassword && !doPasswordsMatch && styles.errorInput,
                ]}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeText}>
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>
            {confirmPassword && !doPasswordsMatch && (
              <Text style={styles.errorHelperText}>Passwords do not match</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>
            <View style={styles.requirement}>
              <Text
                style={[
                  styles.requirementBullet,
                  isPasswordValid && styles.requirementMet,
                ]}
              >
                •
              </Text>
              <Text
                style={[
                  styles.requirementText,
                  isPasswordValid && styles.requirementMet,
                ]}
              >
                At least 6 characters
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.resetButton, !isFormValid && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={!isFormValid}
        >
          <Text style={[styles.resetText, !isFormValid && styles.disabledText]}>
            Reset Password
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: rs(2),
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    fontSize: rs(16),
  },
  errorInput: {
    borderColor: "#ff4444",
  },
  eyeButton: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
  },
  eyeText: {
    fontSize: rs(18),
  },
  helperText: {
    fontSize: rs(14),
    color: "#666",
    marginTop: rs(4),
  },
  errorHelperText: {
    fontSize: rs(14),
    color: "#ff4444",
    marginTop: rs(4),
  },
  requirementsContainer: {
    backgroundColor: "#f8f9fa",
    padding: rs(16),
    borderRadius: rs(12),
    marginTop: rs(16),
  },
  requirementsTitle: {
    fontSize: rs(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: rs(8),
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
  },
  requirementBullet: {
    fontSize: rs(16),
    color: "#ccc",
    marginRight: rs(8),
  },
  requirementText: {
    fontSize: rs(14),
    color: "#666",
  },
  requirementMet: {
    color: "#00B624",
  },
  resetButton: {
    backgroundColor: "#00B624",
    paddingVertical: rs(16),
    borderRadius: rs(12),
    alignItems: "center",
    marginBottom: rs(40),
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  resetText: {
    color: "#fff",
    fontSize: rs(18),
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
});
