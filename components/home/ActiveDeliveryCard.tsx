import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IActiveOrder } from "@/lib/api";

type StatusDef = { label: string; color: string };

type Props = {
  status: string;
  statuses: StatusDef[];
  onNextStatus: () => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onCopy: (text: string) => void;
  activeOrder?: IActiveOrder | null;
  updatingStatus?: boolean;
};

export default function ActiveDeliveryCard({
  status,
  statuses,
  onNextStatus,
  loading = false,
  error = false,
  onRetry,
  onCopy,
  activeOrder,
  updatingStatus = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [hasViewedNote, setHasViewedNote] = useState(false);
  const animatedHeight = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const animatedRotation = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulsing animation for "View Note" button
  useEffect(() => {
    if (activeOrder?.note && !hasViewedNote) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [activeOrder?.note, hasViewedNote, pulseAnim]);

  const handleViewNote = () => {
    setShowNoteModal(true);
    setHasViewedNote(true);
  };

  const toggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: newExpandedState ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: newExpandedState ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation, {
        toValue: newExpandedState ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getColorForStatus = (label: string, index: number) => {
    const currentIndex = statuses.findIndex((s) => s.label === status);
    return index <= currentIndex ? statuses[index].color : "#ddd";
  };

  // Helper to format status labels for display
  const formatStatusLabel = (statusLabel: string): string => {
    return statusLabel
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <View style={styles.deliveryCard}>
      <TouchableOpacity
        style={styles.deliveryHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <Text style={styles.heading}>Active Delivery</Text>
        <Animated.View
          style={{
            transform: [
              {
                rotate: animatedRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          }}
        >
          <Ionicons name="chevron-down" size={24} color="#666" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.deliveryContent,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000],
            }),
            opacity: animatedOpacity,
            overflow: "hidden",
          },
        ]}
      >
        {loading && (
          <View style={{ paddingVertical: 12 }}>
            <View style={styles.skeleton} />
            <View style={[styles.skeleton, { width: "70%" }]} />
          </View>
        )}
        {error && (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: "#d9534f", marginBottom: 8 }}>
              Failed to load rider info.
            </Text>
            {onRetry && (
              <TouchableOpacity style={styles.pastBtn} onPress={onRetry}>
                <Text style={styles.pastBtnText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && !error && !activeOrder && (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: "#999", textAlign: "center" }}>
              No active orders
            </Text>
          </View>
        )}

        {!loading && !error && activeOrder && (
          <>
            {/* Customer Info */}
            <View style={styles.row}>
              {activeOrder.profilePicUrl ? (
                <Image
                  source={{ uri: activeOrder.profilePicUrl }}
                  style={styles.avatar}
                />
              ) : (
                <Ionicons name="person-circle" size={48} color="#9CA3AF" />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}>{activeOrder.userFullName}</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.contact}>
                    {activeOrder.userMobileNumber}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onCopy(activeOrder.userMobileNumber)}
                  >
                    <Ionicons name="copy-outline" size={18} color="#00AA66" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Delivery Stats */}
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {formatStatusLabel(
                    activeOrder.orderTracking.length > 0
                      ? activeOrder.orderTracking[
                          activeOrder.orderTracking.length - 1
                        ].status
                      : "pending"
                  )}
                </Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Amount</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  ₦{activeOrder.amount.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* View Note Button */}
            {activeOrder.note && (
              <Animated.View
                style={[
                  styles.viewNoteContainer,
                  !hasViewedNote && {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.viewNoteButton}
                  onPress={handleViewNote}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#00AA66"
                  />
                  <Text style={styles.viewNoteText}>View Note</Text>
                  {!hasViewedNote && <View style={styles.noteBadge} />}
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Status Flow */}
            <View style={styles.statusFlow}>
              {statuses.map((s, i) => (
                <View key={s.label} style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getColorForStatus(s.label, i) },
                    ]}
                  />
                  {i < statuses.length - 1 && (
                    <View
                      style={[
                        styles.connector,
                        { backgroundColor: getColorForStatus(s.label, i) },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: getColorForStatus(s.label, i) },
                    ]}
                  >
                    {formatStatusLabel(s.label)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Next step */}
            {status !== "delivered" && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  updatingStatus && styles.actionBtnDisabled,
                ]}
                onPress={onNextStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.actionText, { marginLeft: 8 }]}>
                      Updating...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.actionText}>Next</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </Animated.View>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.noteText}>{activeOrder?.note}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNoteModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  deliveryCard: {
    backgroundColor: "#f3f7f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  heading: { fontSize: 18, fontWeight: "600", marginBottom: 0 },
  deliveryContent: { paddingTop: 10 },
  skeleton: {
    height: 12,
    backgroundColor: "#eaeaea",
    borderRadius: 6,
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontWeight: "700", fontSize: 16 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  contact: { color: "#007b55" },
  packageInfo: { color: "#555", marginTop: 4 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  infoBox: { alignItems: "center", flex: 1 },
  infoLabel: { fontSize: 12, color: "#777" },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#222", marginTop: 2 },
  statusFlow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    position: "relative",
  },
  statusItem: { alignItems: "center", flex: 1, position: "relative" },
  statusDot: { width: 14, height: 14, borderRadius: 7, zIndex: 2 },
  connector: {
    position: "absolute",
    top: 6,
    right: "-50%",
    width: "100%",
    height: 2,
    zIndex: 1,
  },
  statusLabel: { fontSize: 10, marginTop: 6 },
  actionBtn: {
    backgroundColor: "#00AA66",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  actionBtnDisabled: {
    backgroundColor: "#80D4B3",
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  pastBtn: {
    backgroundColor: "#e9f5f0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  pastBtnText: { color: "#00AA66", fontWeight: "600" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  viewNoteContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  viewNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F7EF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#00AA66",
    gap: 8,
    alignSelf: "center",
  },
  viewNoteText: {
    color: "#00AA66",
    fontSize: 15,
    fontWeight: "600",
  },
  noteBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    position: "absolute",
    top: 8,
    right: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  modalCloseButton: {
    backgroundColor: "#00AA66",
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
