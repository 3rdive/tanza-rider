// SignInScreen.tsx
import { authService } from "@/lib/api";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants";
import { useUser } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { showAlert } from "@/lib/functions";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
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

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState(""); // mobile only
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { setUser } = useUser();

  // Only validate mobile
  const validateMobile = (value: string) => {
    const trimmed = value.trim();
    const mobileRegex = /^\+?\d{7,15}$/;
    return mobileRegex.test(trimmed);
  };

  const isValidIdentifier = (value: string) => validateMobile(value);

  const handleContinue = async () => {
    if (!showPassword) {
      // First step - validate identifier and show loading
      if (!isValidIdentifier(identifier)) {
        showAlert("Invalid input", "Please enter a valid mobile number");
        return;
      }

      setIsLoading(true);

      try {
        const resp = await authService.checkExisting(identifier.trim());
        setIsLoading(false);
        if (resp?.success && resp?.data?.exists) {
          setShowPassword(true);
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 50);
        } else {
          showAlert(
            "Account not found",
            `No account found for the provided mobile number.`
          );
        }
      } catch (e: any) {
        setIsLoading(false);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Unable to verify account";
        showAlert("Error", msg);
      }
    } else {
      // Second step - handle sign in
      if (!password) {
        showAlert("Missing Password", "Please enter your password");
        return;
      }

      setIsLoading(true);

      try {
        const resp = await authService.login({
          emailOrMobile: identifier.trim(),
          password,
        });
        setIsLoading(false);
        if (resp.success) {
          if (resp.data.user?.role !== "rider") {
            showAlert("Access Denied", "You are not authorized to sign in.");
            return;
          }
          await setUser(resp.data);
          showAlert("Success", "Signed in successfully!");
        } else {
          showAlert("Sign in failed", resp.message || "Please try again");
        }
      } catch (e: any) {
        setIsLoading(false);
        const msg =
          e?.response?.data?.message || e?.message || "An error occurred";
        showAlert("Error", msg);
      }
    }
  };

  const handleBack = () => {
    if (showPassword) {
      // <CHANGE> Reset animation value when going back
      fadeAnim.setValue(0);
      setShowPassword(false);
      setPassword("");
    } else {
      router.canGoBack() && router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container}>
        <View style={styles.content}>
          {showPassword && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              {!showPassword
                ? "Enter your mobile number to continue"
                : "Enter your password to sign in"}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Mobile Identifier Field Only */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Mobile number
                <Text style={{ color: "#999", fontSize: 12 }}>
                  (include country code)
                </Text>
              </Text>

              <View style={styles.phoneContainer}>
                <TouchableOpacity style={styles.countrySelector}>
                  <Text style={styles.flag}>🇳🇬</Text>
                  <Text
                    style={styles.countryCode}
                  >{`+${DEFAULT_COUNTRY_CODE}`}</Text>
                  <Text style={styles.dropdown}>▼</Text>
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.input,
                    showPassword && styles.inputDisabled,
                    { flex: 1 },
                  ]}
                  placeholder="8012345678"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={10}
                  textContentType="telephoneNumber"
                  editable={!showPassword && !isLoading}
                />
              </View>
            </View>

            {/* Password Field - Fixed Animation */}
            {showPassword && (
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                  autoFocus={true}
                />
              </Animated.View>
            )}

            {/* Loading State */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>
                  {!showPassword
                    ? "Checking your account..."
                    : "Signing you in..."}
                </Text>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              ((!isValidIdentifier(identifier) && !showPassword) ||
                (showPassword && !password) ||
                isLoading) &&
                styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={
              (!isValidIdentifier(identifier) && !showPassword) ||
              (showPassword && password.length < 8) ||
              isLoading
            }
          >
            <Text
              style={[
                styles.continueText,
                ((!isValidIdentifier(identifier) && !showPassword) ||
                  (showPassword && password.length < 8) ||
                  isLoading) &&
                  styles.disabledText,
              ]}
            >
              {!showPassword ? "Continue" : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Alternative Options */}
          {!showPassword && !isLoading && (
            <View style={styles.alternativeContainer}>
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => router.replace("/(auth)/mobile-entry")}
              >
                <Text style={styles.createAccountText}>
                  Don&#39;t have an account? Create one
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Forgot Password */}
          {showPassword && !isLoading && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() =>
                router.push("/(auth)/reset_password/forgotten-password")
              }
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
    fontSize: rs(32),
    fontWeight: "bold",
    color: "#000",
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rs(16),
    color: "#666",
    lineHeight: rs(22),
  },
  formContainer: {},
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
    color: "black",
    borderWidth: rs(2),
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
    fontSize: rs(16),
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#d0d0d0",
    color: "#666",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: rs(40),
  },
  loadingText: {
    fontSize: rs(16),
    color: "#666",
    marginTop: rs(16),
  },
  continueButton: {
    backgroundColor: "#000",
    paddingVertical: rs(16),
    borderRadius: rs(12),
    alignItems: "center",
    marginBottom: rs(30),
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  continueText: {
    color: "#fff",
    fontSize: rs(18),
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    padding: rs(4),
    borderRadius: rs(10),
    marginBottom: rs(16),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: rs(10),
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: rs(4),
    elevation: 1,
  },
  toggleText: {
    color: "#666",
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#000",
    fontWeight: "600",
  },

  alternativeContainer: {
    marginBottom: rs(40),
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: rs(24),
  },
  line: {
    flex: 1,
    height: rs(1),
    backgroundColor: "#e0e0e0",
  },
  orText: {
    marginHorizontal: rs(16),
    color: "#666",
    fontSize: rs(16),
  },
  createAccountButton: {
    alignItems: "center",
    paddingVertical: rs(12),
  },
  createAccountText: {
    fontSize: rs(16),
    color: "#000",
    fontWeight: "500",
  },
  forgotPasswordButton: {
    alignItems: "center",
    paddingVertical: rs(12),
    marginBottom: rs(40),
  },
  forgotPasswordText: {
    fontSize: rs(16),
    color: "#000",
    fontWeight: "500",
  },
  phoneContainer: {
    flexDirection: "row",
    // marginBottom: 30,
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
});
