// CompleteInfoScreen.tsx
import { authService, storageService } from "@/lib/api";
import { rs, showAlert } from "@/lib/functions";
import { useAuthFlow, useUser } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CompleteInfoScreen() {
  const { mobile, otp } = useAuthFlow();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState<string>("");
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const hasTwoWords = (s: string) => s.trim().split(/\s+/).length >= 2;

  const isFormValid = () => {
    return hasTwoWords(fullName) && password.length >= 8 && !!profilePic;
  };

  const handleComplete = async () => {
    if (!isFormValid()) {
      showAlert("Invalid Information", "Please fill all fields correctly");
      return;
    }

    setIsLoading(true);

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      const payload = {
        firstName,
        lastName,
        mobile: mobile as string,
        password,
        otp: otp as string,
        role: "rider",
        profilePic: profilePic?.trim() ? profilePic.trim() : null,
        countryCode: "+234",
      };
      const resp = await authService.signUp(payload);
      if (resp.success) {
        await setUser(resp.data);
        showAlert("Success", "Account created successfully!");
      } else {
        showAlert(
          "Sign up failed",
          Array.isArray(resp.message)
            ? resp.message[0]
            : resp.message || "Please try again"
        );
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "An error occurred during sign up";
      showAlert("Error", Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mobile || !otp) {
      router.replace("/(auth)/mobile-entry");
    }
  }, [mobile, otp]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      ></KeyboardAvoidingView>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Let us know how to properly address you and secure your account
          &middot;{" "}
          <Text
            style={{
              color: "blue",
            }}
            onPress={() => router.replace("/(auth)/mobile-entry")}
          >
            {`+234 ${mobile}`}
          </Text>
        </Text>
        {/* Profile picture avatar + upload */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Profile Photo <Text style={{ color: "red" }}>*</Text>{" "}
          </Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {profilePic ? (
                <Image
                  source={{ uri: profilePic }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {fullName.trim().split(/\s+/)[0]?.[0]?.toUpperCase() || "P"}
                    {fullName.trim().split(/\s+/)[1]?.[0]?.toUpperCase() || ""}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.selectPhotoBtn}
              disabled={isUploading}
              onPress={async () => {
                try {
                  const perm =
                    await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (perm.status !== "granted") {
                    showAlert(
                      "Permission needed",
                      "We need access to your photos to select a profile picture."
                    );
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                  });
                  if (result.canceled) return;
                  const uri = result.assets?.[0]?.uri;
                  if (!uri) return;
                  // Optimistic: show a local image while uploading
                  // We'll upload and replace with the server URL when done
                  const timer = setTimeout(() => {}, 400);
                  setIsUploading(true);
                  const resp = await storageService.upload({
                    uri,
                    type: "image/jpeg",
                  });
                  clearTimeout(timer);
                  if (resp?.success) {
                    const url = (resp.data as any)?.url;
                    if (url) setProfilePic(url);
                  } else {
                    showAlert(
                      "Upload Error",
                      resp?.message || "Unable to upload image",
                      [{ text: "Cancel", style: "cancel" }]
                    );
                  }
                } catch (e: any) {
                  showAlert(
                    "Upload Error",
                    e?.response?.data?.message ||
                      e?.message ||
                      "Unable to upload image"
                  );
                } finally {
                  setIsUploading(false);
                }
              }}
            >
              {isUploading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.selectPhotoBtnText}>Select Photo</Text>
              )}
            </TouchableOpacity>
          </View>
          {/*<Text style={styles.helperText}>Image will be uploaded and linked to your account.</Text>*/}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Full name <Text style={{ color: "red" }}>*</Text>{" "}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name (first and last)"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Text style={styles.helperText}>
            Enter at least first and last name
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Password <Text style={{ color: "red" }}>*</Text>{" "}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>Minimum 8 characters</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            !isFormValid() && styles.disabledButton,
          ]}
          onPress={handleComplete}
          disabled={!isFormValid()}
        >
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <Text
              style={[
                styles.completeText,
                !isFormValid() && styles.disabledText,
              ]}
            >
              Complete Setup
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    color: "#000",
  },
  title: {
    fontSize: rs(28),
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: rs(16),
    color: "#666",
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: rs(16),
    color: "#000",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    color: "black",
    borderWidth: rs(2),
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    fontSize: rs(16),
    backgroundColor: "#fff",
  },
  errorInput: {
    borderColor: "#ff4444",
  },
  helperText: {
    fontSize: rs(14),
    color: "#666",
    marginTop: 4,
  },
  errorText: {
    fontSize: rs(14),
    color: "#ff4444",
    marginTop: 4,
  },
  emailDisplay: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  emailLabel: {
    fontSize: rs(14),
    color: "#666",
    marginBottom: 4,
  },
  emailText: {
    fontSize: rs(16),
    color: "#000",
    fontWeight: "500",
  },
  completeButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  completeText: {
    color: "#fff",
    fontSize: rs(18),
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
  useLocationBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f0f9f1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d6f5db",
  },
  useLocationBtnText: {
    color: "#00B624",
    fontWeight: "600",
  },
  suggestionBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionTitle: {
    fontSize: rs(15),
    color: "#000",
    fontWeight: "600",
  },
  suggestionSubtitle: {
    fontSize: rs(13),
    color: "#666",
    marginTop: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f2f2f2",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#666",
    fontSize: rs(20),
    fontWeight: "700",
  },
  selectPhotoBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectPhotoBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  clearBtnText: {
    fontSize: rs(18),
    color: "#999",
    fontWeight: "600",
  },
});
