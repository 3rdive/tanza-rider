import { authService } from "@/lib/api";
import { showAlert } from "@/lib/functions";
import { useAuthFlow } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

const SpotifyCreateAccount = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { setMobile } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [selectedCountry] = useState({
    code: "+234",
    flag: "🇳🇬",
    name: "NG",
  });

  const BackIcon = () => (
    <View style={styles.backIcon}>
      <Text style={styles.backIconText}>‹</Text>
    </View>
  );

  // const formValid= phoneNumber.length === 10 && !loading;

  // Helper that prefers the custom modal but falls back to native Alert

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Check if mobile already exists; if it does, alert and stop
      const exists = await authService.userExistsByMobile(phoneNumber);
      if (exists) {
        showAlert(
          "Error",
          "This mobile number is already associated with an account. Please sign in or use a different number.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign In",
              onPress: () => router.push("/(auth)/sign-in"),
            },
          ]
        );
        return;
      }

      const resp = await authService.sendOtp({
        otpType: "MOBILE",
        reference: phoneNumber,
      });

      if (resp.success) {
        setMobile(phoneNumber);
        router.push("/(auth)/otp-verification");
      } else {
        showAlert("Failed", resp.message || "Unable to send OTP");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "An error occurred while sending OTP";
      showAlert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = () => {
    console.log("Open country picker");
    // Add country picker logic here
  };

  const handleBack = () => {
    console.log("Go back");
    router.replace("/(auth)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create account</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <Text style={styles.questionTitle}>Enter your mobile number?</Text>

            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={handleCountrySelect}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="9153058596"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.helperText}>
              We&#39;ll send you a verification code to confirm your number
            </Text>

            <TouchableOpacity
              style={[
                styles.nextButton,
                phoneNumber.length === 10 && !loading
                  ? styles.nextButtonActive
                  : styles.nextButtonInactive,
              ]}
              onPress={handleSubmit}
              disabled={phoneNumber.length !== 10 || loading}
            >
              {loading ? (
                <ActivityIndicator color={"black"} size={30} />
              ) : (
                <Text
                  style={[
                    styles.nextButtonText,
                    phoneNumber.length === 10
                      ? styles.nextButtonTextActive
                      : styles.nextButtonTextInactive,
                  ]}
                >
                  Next
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  backIconText: {
    color: "black",
    fontSize: 24,
    fontWeight: "300",
  },
  headerTitle: {
    color: "black",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingTop: 32,
  },
  questionTitle: {
    color: "black",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    lineHeight: 34,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    // backgroundColor: '#333',
    backgroundColor: "#e8e7e7",
    borderWidth: 0.8,
    borderRadius: 8,
    overflow: "hidden",
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#555",
    minWidth: 100,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  countryCode: {
    color: "black",
    fontSize: 16,
    marginRight: 8,
  },
  dropdownIcon: {
    color: "#999",
    fontSize: 10,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "transparent",
    color: "black",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  helperText: {
    color: "#999",
    fontSize: 14,
    marginBottom: 48,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignSelf: "center",
    minWidth: 120,
    alignItems: "center",
  },
  nextButtonActive: {
    backgroundColor: "#1DB954",
  },
  nextButtonInactive: {
    opacity: 0.5,
    backgroundColor: "#1DB954",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonTextActive: {
    color: "white",
  },
  nextButtonTextInactive: {
    color: "#666",
  },
});

export default SpotifyCreateAccount;
