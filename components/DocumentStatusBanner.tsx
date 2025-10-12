import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type DocumentStatus =
  | "INITIAL"
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

interface DocumentStatusBannerProps {
  documentStatus: string;
  rejectionReason?: string | null;
}

export default function DocumentStatusBanner({
  documentStatus,
  rejectionReason,
}: DocumentStatusBannerProps) {
  const router = useRouter();
  const status = documentStatus.toUpperCase() as DocumentStatus;

  // Don't show banner for SUBMITTED or APPROVED
  if (status === "SUBMITTED" || status === "APPROVED") {
    return null;
  }

  const handleNavigateToDocuments = () => {
    router.push("/profile/document");
  };

  const renderBanner = () => {
    switch (status) {
      case "INITIAL":
        return (
          <View style={[styles.banner, styles.bannerInitial]}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={24} color="#ff9800" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.bannerTitle}>Documents Required</Text>
              <Text style={styles.bannerMessage}>
                Upload your documents to start receiving orders.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNavigateToDocuments}
            >
              <Text style={styles.actionButtonText}>Upload</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case "PENDING":
        return (
          <View style={[styles.banner, styles.bannerPending]}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={24} color="#2196f3" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.bannerTitle}>Documents Under Review</Text>
              <Text style={styles.bannerMessage}>
                Your documents are being reviewed. You&apos;ll be notified once
                the review is complete.
              </Text>
            </View>
          </View>
        );

      case "REJECTED":
        return (
          <View style={[styles.banner, styles.bannerRejected]}>
            <View style={styles.iconContainer}>
              <Ionicons name="close-circle" size={24} color="#f44336" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.bannerTitle}>Documents Rejected</Text>
              <Text style={styles.bannerMessage}>
                {rejectionReason ||
                  "Your documents were rejected. Please re-upload your documents."}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonRejected]}
              onPress={handleNavigateToDocuments}
            >
              <Text style={styles.actionButtonText}>Fix Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderBanner()}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bannerInitial: {
    backgroundColor: "#fff3e0",
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  bannerPending: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  bannerRejected: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonRejected: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
