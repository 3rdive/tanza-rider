// CompleteInfoScreen.tsx
import { authService, storageService } from "@/lib/api";
import { rs, showAlert, showPermissionAlert } from "@/lib/functions";
import { useAuthFlow, useUser } from "@/redux/hooks/hooks";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import Constants from "expo-constants";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CompleteInfoScreen() {
  const { mobile, otp } = useAuthFlow();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState<string>("");
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { colors } = useTheme();
  const toast = useToast();
  const [touched, setTouched] = useState({
    fullName: false,
    password: false,
    profilePic: true,
  });

  const hasTwoWords = (s: string) => s.trim().split(/\s+/).length >= 2;

  const getFullNameError = (): string | null => {
    if (!touched.fullName) return null;
    if (!fullName.trim()) return "Full name is required";
    if (!hasTwoWords(fullName))
      return "Please enter at least first and last name";
    return null;
  };

  const getPasswordError = (): string | null => {
    if (!touched.password) return null;
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  const getProfilePicError = (): string | null => {
    if (!touched.profilePic) return null;
    if (!profilePic) return "Profile photo is required";
    return null;
  };

  const isFormValid = () => {
    return !getFullNameError() && !getPasswordError() && !getProfilePicError();
  };

  const handleComplete = async () => {
    setTouched({ fullName: true, password: true, profilePic: true });

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
        toast.success("Success", "Account created successfully!");
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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: rs(16),
      color: colors.textSecondary,
      marginBottom: 40,
      lineHeight: 22,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: rs(16),
      color: colors.text,
      marginBottom: 8,
      fontWeight: "500",
    },
    input: {
      color: colors.text,
      borderWidth: rs(2),
      borderColor: colors.border,
      borderRadius: rs(12),
      paddingHorizontal: rs(16),
      paddingVertical: rs(16),
      fontSize: rs(16),
      backgroundColor: colors.surface,
    },
    errorInput: {
      borderColor: "#ff4444",
    },
    helperText: {
      fontSize: rs(14),
      color: colors.textSecondary,
      marginTop: 4,
    },
    errorText: {
      fontSize: rs(14),
      color: "#ff4444",
      marginTop: 4,
    },
    emailDisplay: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 40,
    },
    emailLabel: {
      fontSize: rs(14),
      color: colors.textSecondary,
      marginBottom: 4,
    },
    emailText: {
      fontSize: rs(16),
      color: colors.text,
      fontWeight: "500",
    },
    completeButton: {
      backgroundColor: colors.text,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 40,
    },
    disabledButton: {
      backgroundColor: colors.border,
    },
    completeText: {
      color: colors.surface,
      fontSize: rs(18),
      fontWeight: "600",
    },
    disabledText: {
      color: colors.textSecondary,
    },
    useLocationBtn: {
      marginTop: 8,
      alignSelf: "flex-start",
      backgroundColor: colors.tabBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    useLocationBtnText: {
      color: colors.primary,
      fontWeight: "600",
    },
    suggestionBox: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    suggestionItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionTitle: {
      fontSize: rs(15),
      color: colors.text,
      fontWeight: "600",
    },
    suggestionSubtitle: {
      fontSize: rs(13),
      color: colors.textSecondary,
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
      borderColor: colors.border,
      backgroundColor: colors.background,
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
      color: colors.textSecondary,
      fontSize: rs(20),
      fontWeight: "700",
    },
    selectPhotoBtn: {
      backgroundColor: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    selectPhotoBtnText: {
      color: colors.surface,
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
      color: colors.textSecondary,
      fontWeight: "600",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
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
                      {fullName.trim().split(/\s+/)[0]?.[0]?.toUpperCase() ||
                        "P"}
                      {fullName.trim().split(/\s+/)[1]?.[0]?.toUpperCase() ||
                        ""}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.selectPhotoBtn}
                disabled={uploadingPhoto}
                onPress={async () => {
                  // Defensive handler: break complex steps into guarded stages so failures don't crash the app.
                  // Also ensure setIsUploading is always reset in finally.

                  // Quick sanity: ensure ImagePicker API exists
                  if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
                    showAlert(
                      "Not Available",
                      "Image picker is not available on this platform."
                    );
                    return;
                  }

                  // Guard for Expo Go on iOS: Expo Go's binary does not include app-specific Info.plist keys,
                  // so attempting to request photo permissions will crash the app. In that environment,
                  // instruct the developer to use a dev client / standalone build.
                  try {
                    if (
                      Constants?.appOwnership === "expo" &&
                      Platform.OS === "ios"
                    ) {
                      showAlert(
                        "Not supported in Expo Go (iOS)",
                        "The iOS Expo Go client does not include your app's photo permission strings and will crash when the app attempts to access the photo library. To test image selection on iOS please run a local development build or install a custom dev client / standalone build that includes your app's Info.plist entries."
                      );
                      return;
                    }
                  } catch (constErr) {
                    // If Constants isn't available for some reason, just continue with permission checks
                    console.warn("Constants check failed:", constErr);
                  }

                  // Start upload state early to reflect UI - will be cleared in finally
                  setIsUploading(true);

                  try {
                    // Permission checks (skip on web)
                    if (Platform.OS !== "web") {
                      try {
                        const current =
                          await ImagePicker.getMediaLibraryPermissionsAsync();
                        const currentGranted =
                          typeof (current as any)?.granted === "boolean"
                            ? (current as any).granted
                            : (current as any)?.status === "granted";

                        if (!currentGranted) {
                          const request =
                            await ImagePicker.requestMediaLibraryPermissionsAsync();
                          const granted =
                            typeof (request as any)?.granted === "boolean"
                              ? (request as any).granted
                              : (request as any)?.status === "granted";

                          if (!granted) {
                            // Ask user to open settings
                            showPermissionAlert(
                              "Permission needed",
                              "We need access to your photos to select a profile picture.",
                              "photos"
                            );
                            return;
                          }
                        }
                      } catch (permErr) {
                        // If permission API throws, log and show a friendly message
                        console.warn("Media permission check failed:", permErr);
                        showPermissionAlert(
                          "Permission needed",
                          "We need access to your photos to select a profile picture.",
                          "photos"
                        );
                        return;
                      }
                    }

                    // Launch picker in its own try/catch so errors here are isolated
                    let result: any = null;
                    try {
                      result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                      });
                    } catch (launchErr) {
                      console.warn("Failed to open image picker:", launchErr);
                      showAlert(
                        "Error",
                        "Unable to open image picker. Please try again."
                      );
                      return;
                    }

                    // Support both `canceled` and older `cancelled` flags
                    const wasCancelled =
                      (result as any).canceled ??
                      (result as any).cancelled ??
                      false;
                    if (wasCancelled) return;

                    // Support both new assets array and older uri field
                    const uri =
                      (result as any).assets?.[0]?.uri ?? (result as any).uri;
                    if (!uri) {
                      // Nothing to upload
                      return;
                    }

                    // Check file size (3MB limit)
                    const fileSize = (result as any).assets?.[0]?.fileSize;
                    if (fileSize && fileSize > 2 * 1024 * 1024) {
                      showAlert(
                        "File Too Large",
                        "Please select an image smaller than 2MB"
                      );
                      return;
                    }

                    // Upload step - ensure we catch upload errors explicitly
                    setUploadingPhoto(true);
                    try {
                      const resp = await storageService.upload({
                        uri,
                        type: "image/jpeg",
                      });

                      if (resp?.success) {
                        const url = (resp.data as any)?.url;
                        if (url) {
                          setProfilePic(url);
                        } else {
                          // success true but no url - inform user
                          showAlert(
                            "Upload Error",
                            "Upload succeeded but no image URL was returned."
                          );
                        }

                        toast.success(
                          "Upload Successful",
                          "Profile photo uploaded."
                        );
                      } else {
                        showAlert(
                          "Upload Error",
                          resp?.message || "Unable to upload image",
                          [{ text: "Cancel", style: "cancel" }]
                        );
                      }
                    } catch (uploadErr: any) {
                      console.error("Image upload failed:", uploadErr);
                      toast.error(
                        "Upload Error",
                        uploadErr?.response?.data?.message ||
                          uploadErr?.message ||
                          "Unable to upload image"
                      );
                    } finally {
                      setUploadingPhoto(false);
                    }
                  } catch (e: any) {
                    // Top-level catch as an extra safety net
                    console.error(
                      "Unexpected error during image selection:",
                      e
                    );
                    toast.error(
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
                {uploadingPhoto ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.selectPhotoBtnText}>Select Photo</Text>
                )}
              </TouchableOpacity>
            </View>
            {getProfilePicError() && (
              <Text style={styles.errorText}>{getProfilePicError()}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Full name <Text style={{ color: "red" }}>*</Text>{" "}
            </Text>
            <TextInput
              style={[styles.input, getFullNameError() && styles.errorInput]}
              value={fullName}
              onChangeText={setFullName}
              onBlur={() => setTouched({ ...touched, fullName: true })}
              autoCapitalize="words"
            />
            {getFullNameError() ? (
              <Text style={styles.errorText}>{getFullNameError()}</Text>
            ) : (
              <Text style={styles.helperText}>
                Enter at least first and last name
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Password <Text style={{ color: "red" }}>*</Text>{" "}
            </Text>
            <TextInput
              style={[styles.input, getPasswordError() && styles.errorInput]}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched({ ...touched, password: true })}
              secureTextEntry
              autoCapitalize="none"
            />
            {getPasswordError() ? (
              <Text style={styles.errorText}>{getPasswordError()}</Text>
            ) : (
              <Text style={styles.helperText}>Minimum 8 characters</Text>
            )}
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
      </KeyboardAvoidingView>{" "}
    </SafeAreaView>
  );
}
