import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { showAlert } from "@/lib/functions";
import * as Linking from "expo-linking";

export default function HelpSupportScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supportEmail = useMemo(() => {
    const env = (process as any)?.env || {};
    return env.EXPO_PUBLIC_APP_EMAIL || "";
  }, []);

  const onSubmit = async () => {
    if (!supportEmail) {
      showAlert("Unavailable", "Support email is not configured.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      showAlert("Missing info", "Please provide a title and a description.");
      return;
    }

    setSubmitting(true);
    try {
      const subject = encodeURIComponent(`[Tanza Support] ${title.trim()}`);
      const body = encodeURIComponent(description.trim());
      const url = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        showAlert("Error", "No email app available on this device.");
      }
    } catch (e) {
      showAlert("Error", "Failed to open email composer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Send us a message</Text>
          <Text style={styles.helperText}>
            Fill the form below and we will reach you via email. Your email app
            will open to send the message to our support team.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Brief title"
              style={styles.input}
              maxLength={120}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your issue or feedback"
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            disabled={submitting || !title.trim() || !description.trim()}
            style={[
              styles.button,
              (submitting || !title.trim() || !description.trim()) &&
                styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Opening…" : "Send Email"}
            </Text>
          </TouchableOpacity>

          {!supportEmail ? (
            <Text style={styles.warning}>
              Support email is not configured. Set EXPO_PUBLIC_APP_EMAIL in .env
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { padding: 16 },
  subtitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  helperText: { color: "#6b7280", marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  textarea: { height: 140 },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#ffffff", fontWeight: "600" },
  warning: { color: "#b45309", marginTop: 12 },
});
