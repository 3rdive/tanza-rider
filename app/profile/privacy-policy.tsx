import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tanza Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: September 19, 2025</Text>

        <Text style={styles.paragraph}>
          We value your privacy. This policy explains what information we collect, how we use it,
          and your choices. By using this app, you agree to the collection and use of information
          in accordance with this policy.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          - Account information (name, email, phone number)
          {"\n"}- Location information you provide or allow
          {"\n"}- Transactional data related to orders and payments
          {"\n"}- Device and usage information for app performance and analytics
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Information</Text>
        <Text style={styles.paragraph}>
          We use your information to provide and improve our services, including booking orders,
          processing payments, customer support, and personalizing your experience. We may also use
          data for security, fraud prevention, and to comply with legal obligations.
        </Text>

        <Text style={styles.sectionTitle}>3. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We may share data with trusted service providers
          who assist in operating the app (e.g., payment processing, cloud storage), and when
          required by law.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your data.
          However, no method of transmission over the internet or electronic storage is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Choices</Text>
        <Text style={styles.paragraph}>
          You can update your profile information in the app. You may disable location access from
          your device settings. For data access or deletion requests, please contact support.
        </Text>

        <Text style={styles.sectionTitle}>6. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please reach out via the Help &
          Support page in the app.
        </Text>

        <View style={{ height: 24 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backArrow: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  updated: { color: "#6b7280", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 14, color: "#374151", lineHeight: 22 },
});