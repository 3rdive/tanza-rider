import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlert } from "@/lib/functions";
import { RFValue } from "react-native-responsive-fontsize";
import { userService } from "@/lib/api";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 2) * UI_SCALE);

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!currentPassword) {
      showAlert("Invalid", "Please enter your current password");
      return false;
    }
    if (!newPassword || newPassword.length < 8) {
      showAlert("Invalid", "New password must be at least 8 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Invalid", "New passwords do not match");
      return false;
    }
    if (newPassword === currentPassword) {
      showAlert(
        "Invalid",
        "New password must be different from current password"
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const resp = await userService.updatePassword({
        currentPassword,
        newPassword,
      });
      if (resp?.success) {
        showAlert("Success", resp.message || "Password changed successfully");
        router.back();
      } else {
        showAlert("Failed", resp?.message || "Could not change password");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to change password";
      showAlert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        >
          <Text style={[styles.saveButtonText, loading && styles.disabledText]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry
              editable={!loading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: { width: rs(40), height: rs(40), justifyContent: "center" },
  backArrow: { fontSize: rs(24), color: "#000" },
  headerTitle: { fontSize: rs(18), fontWeight: "bold", color: "#000" },
  saveButton: { paddingHorizontal: rs(16), paddingVertical: rs(8) },
  saveButtonText: { fontSize: rs(16), color: "#00B624", fontWeight: "600" },
  disabledText: { color: "#999" },
  content: { flex: 1, paddingHorizontal: rs(20), paddingTop: rs(24) },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: rs(12),
    padding: rs(20),
    marginBottom: rs(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: { marginBottom: rs(20) },
  label: {
    fontSize: rs(16),
    color: "#000",
    marginBottom: rs(8),
    fontWeight: "500",
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    paddingHorizontal: 16,
    paddingVertical: rs(16),
    fontSize: rs(16),
    backgroundColor: "#fff",
  },
});
