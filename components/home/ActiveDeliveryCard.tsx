import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IActiveOrder, orderService } from "@/lib/api";

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
  onRefetchOrders?: () => void;
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
  onRefetchOrders,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const animatedHeight = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const animatedRotation = useRef(new Animated.Value(1)).current;
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLate, setIsLate] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null);

  // Parse ETA string like "1 hour 12 minutes 47 seconds" to milliseconds
  const parseEtaToMs = (etaString: string): number => {
    let totalMs = 0;
    const hourMatch = etaString.match(/(\d+)\s*hour/);
    const minuteMatch = etaString.match(/(\d+)\s*minute/);
    const secondMatch = etaString.match(/(\d+)\s*second/);

    if (hourMatch) totalMs += parseInt(hourMatch[1]) * 60 * 60 * 1000;
    if (minuteMatch) totalMs += parseInt(minuteMatch[1]) * 60 * 1000;
    if (secondMatch) totalMs += parseInt(secondMatch[1]) * 1000;

    return totalMs;
  };

  // Format milliseconds to human-readable time
  const formatTimeRemaining = (ms: number): string => {
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (seconds > 0 || parts.length === 0)
      parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

    return parts.join(" ");
  };

  // Update countdown timer
  useEffect(() => {
    if (!activeOrder || !activeOrder.eta || !activeOrder.createdAt) {
      return;
    }

    const updateTimer = () => {
      const createdAt = new Date(activeOrder.createdAt).getTime();
      const etaMs = parseEtaToMs(activeOrder.eta);
      const expectedDeliveryTime = createdAt + etaMs;
      const now = Date.now();
      const diff = expectedDeliveryTime - now;

      if (diff < 0) {
        setIsLate(true);
        setTimeRemaining(formatTimeRemaining(diff));
      } else {
        setIsLate(false);
        setTimeRemaining(formatTimeRemaining(diff));
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeOrder]);

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

  // Handler to mark a destination as delivered
  const handleMarkAsDelivered = async (destinationId: string) => {
    if (!activeOrder) return;

    try {
      setMarkingDelivered(destinationId);
      await orderService.markDestinationAsDelivered({
        orderId: activeOrder.orderId,
        destinationId,
      });

      Alert.alert("Success", "Destination marked as delivered");

      // Refetch orders to get updated data
      if (onRefetchOrders) {
        onRefetchOrders();
      }
    } catch (error: any) {
      console.error("Error marking destination as delivered:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to mark destination as delivered",
      );
    } finally {
      setMarkingDelivered(null);
    }
  };

  // Check if all destinations are delivered
  const allDestinationsDelivered = () => {
    if (!activeOrder || !activeOrder.hasMultipleDeliveries) {
      return true; // No multiple deliveries, so no restriction
    }
    return activeOrder.deliveryDestinations.every((dest) => dest.delivered);
  };

  // Check if the next step is "delivered"
  const isNextStepDelivered = () => {
    const currentIndex = statuses.findIndex((s) => s.label === status);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1].label;
      return nextStatus === "delivered";
    }
    return false;
  };

  // Determine if "Continue to Next Step" should be disabled
  const shouldDisableContinue = () => {
    return isNextStepDelivered() && !allDestinationsDelivered();
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
              outputRange: [0, 2500],
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
            {/* Customer Info Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color="#00AA66" />
                <Text style={styles.sectionTitle}>Customer Information</Text>
              </View>

              <View style={styles.row}>
                {activeOrder.profilePicUrl ? (
                  <Image
                    source={{ uri: activeOrder.profilePicUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <Ionicons name="person-circle" size={48} color="#9CA3AF" />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{activeOrder.userFullName}</Text>
                  <View style={styles.phoneRow}>
                    <Ionicons name="call" size={16} color="#00AA66" />
                    <Text style={styles.contact}>
                      {activeOrder.userMobileNumber}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onCopy(activeOrder.userMobileNumber)}
                    >
                      <Ionicons name="copy-outline" size={18} color="#00AA66" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.userDetailsRow}>
                    <Ionicons name="mail" size={14} color="#666" />
                    <Text style={styles.userEmail}>Contact via phone</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* ETA Countdown Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.etaContainer}>
                <Ionicons
                  name="time"
                  size={20}
                  color={isLate ? "#FF3B30" : "#00AA66"}
                />
                <Text
                  style={[
                    styles.etaText,
                    isLate ? styles.etaLateText : styles.etaOnTimeText,
                  ]}
                >
                  {isLate
                    ? `${timeRemaining} late`
                    : `Expected delivery in ${timeRemaining}`}
                </Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* Order Details Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#00AA66" />
                <Text style={styles.sectionTitle}>Order Details</Text>
              </View>

              <View style={styles.orderDetailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    ₦{activeOrder.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>
                    {activeOrder.userFullName}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* Sender & Recipient Info Section */}
            {activeOrder.sender && activeOrder.recipient && (
              <>
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="people" size={20} color="#00AA66" />
                    <Text style={styles.sectionTitle}>Sender & Recipient</Text>
                  </View>

                  {/* Sender Info */}
                  <View style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                      <Ionicons
                        name="arrow-up-circle"
                        size={20}
                        color="#FF6B35"
                      />
                      <Text style={styles.contactRole}>Sender</Text>
                    </View>
                    <View style={styles.contactDetails}>
                      <View style={styles.contactRow}>
                        <Ionicons name="person" size={16} color="#666" />
                        <Text style={styles.contactText}>
                          {activeOrder.sender.name}
                        </Text>
                      </View>
                      <View style={styles.contactRow}>
                        <Ionicons name="call" size={16} color="#666" />
                        <Text style={styles.contactText}>
                          {activeOrder.sender.phone}
                        </Text>
                        <TouchableOpacity
                          onPress={() => onCopy(activeOrder.sender.phone)}
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#00AA66"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.contactRow}>
                        <Ionicons name="mail" size={16} color="#666" />
                        <Text style={styles.contactText}>
                          {activeOrder.sender.email}
                        </Text>
                        <TouchableOpacity
                          onPress={() => onCopy(activeOrder.sender.email)}
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#00AA66"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Recipient Info */}
                  <View style={[styles.contactCard, { marginTop: 12 }]}>
                    <View style={styles.contactHeader}>
                      <Ionicons
                        name="arrow-down-circle"
                        size={20}
                        color="#00AA66"
                      />
                      <Text style={styles.contactRole}>Recipient</Text>
                    </View>
                    <View style={styles.contactDetails}>
                      <View style={styles.contactRow}>
                        <Ionicons name="person" size={16} color="#666" />
                        <Text style={styles.contactText}>
                          {activeOrder.recipient.name}
                        </Text>
                      </View>
                      <View style={styles.contactRow}>
                        <Ionicons name="call" size={16} color="#666" />
                        <Text style={styles.contactText}>
                          {activeOrder.recipient.phone}
                        </Text>
                        <TouchableOpacity
                          onPress={() => onCopy(activeOrder.recipient.phone)}
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#00AA66"
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.contactRow}>
                        <Ionicons name="mail" size={16} color="#666" />
                        <Text style={styles.contactText}>
                          {activeOrder.recipient.email}
                        </Text>
                        <TouchableOpacity
                          onPress={() => onCopy(activeOrder.recipient.email)}
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color="#00AA66"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.dividerLine} />
              </>
            )}

            {/* Location Details Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={20} color="#00AA66" />
                <Text style={styles.sectionTitle}>Pickup & Delivery</Text>
              </View>

              <View style={styles.locationContainer}>
                <View style={styles.locationItem}>
                  <View style={styles.locationIconContainer}>
                    <Ionicons
                      name="arrow-up-circle"
                      size={24}
                      color="#FF6B35"
                    />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Pickup Location</Text>
                    <Text style={styles.locationText}>
                      {activeOrder.pickUpLocation.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.locationConnector} />

                {/* Multiple Delivery Destinations */}
                {activeOrder.hasMultipleDeliveries &&
                activeOrder.deliveryDestinations &&
                activeOrder.deliveryDestinations.length > 0 ? (
                  <>
                    {activeOrder.deliveryDestinations.map(
                      (destination, index) => (
                        <React.Fragment key={destination.id}>
                          <View style={styles.locationItem}>
                            <View style={styles.locationIconContainer}>
                              <Ionicons
                                name="arrow-down-circle"
                                size={24}
                                color={
                                  destination.delivered ? "#00AA66" : "#FFA500"
                                }
                              />
                            </View>
                            <View style={styles.locationInfo}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <Text style={styles.locationLabel}>
                                  Drop-off {index + 1}
                                </Text>
                                {destination.delivered && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color="#00AA66"
                                  />
                                )}
                              </View>
                              <Text style={styles.locationText}>
                                {destination.dropOffLocation.address}
                              </Text>
                              <Text
                                style={[styles.locationLabel, { marginTop: 4 }]}
                              >
                                {destination.recipient.name} •{" "}
                                {destination.recipient.phone}
                              </Text>
                              <Text
                                style={[styles.locationLabel, { marginTop: 2 }]}
                              >
                                {destination.distanceFromPickupKm.toFixed(2)} km
                                • ₦{destination.deliveryFee.toLocaleString()}
                              </Text>

                              {/* Mark as Delivered Button */}
                              {!destination.delivered &&
                                status !== "delivered" && (
                                  <TouchableOpacity
                                    style={[
                                      styles.markDeliveredBtn,
                                      markingDelivered === destination.id &&
                                        styles.markDeliveredBtnDisabled,
                                    ]}
                                    onPress={() =>
                                      handleMarkAsDelivered(destination.id)
                                    }
                                    disabled={
                                      markingDelivered === destination.id
                                    }
                                  >
                                    {markingDelivered === destination.id ? (
                                      <View style={styles.loadingContainer}>
                                        <ActivityIndicator
                                          color="#fff"
                                          size="small"
                                        />
                                        <Text
                                          style={[
                                            styles.markDeliveredText,
                                            { marginLeft: 6 },
                                          ]}
                                        >
                                          Marking...
                                        </Text>
                                      </View>
                                    ) : (
                                      <View style={styles.loadingContainer}>
                                        <Ionicons
                                          name="checkmark-circle"
                                          size={18}
                                          color="#fff"
                                        />
                                        <Text
                                          style={[
                                            styles.markDeliveredText,
                                            { marginLeft: 6 },
                                          ]}
                                        >
                                          Mark as Delivered
                                        </Text>
                                      </View>
                                    )}
                                  </TouchableOpacity>
                                )}

                              {destination.delivered &&
                                destination.deliveredAt && (
                                  <Text
                                    style={[
                                      styles.locationLabel,
                                      { marginTop: 4, color: "#00AA66" },
                                    ]}
                                  >
                                    ✓ Delivered at{" "}
                                    {new Date(
                                      destination.deliveredAt,
                                    ).toLocaleString()}
                                  </Text>
                                )}
                            </View>
                          </View>
                          {index <
                            activeOrder.deliveryDestinations.length - 1 && (
                            <View style={styles.locationConnector} />
                          )}
                        </React.Fragment>
                      ),
                    )}
                  </>
                ) : (
                  <View style={styles.locationItem}>
                    <View style={styles.locationIconContainer}>
                      <Ionicons
                        name="arrow-down-circle"
                        size={24}
                        color="#00AA66"
                      />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationLabel}>
                        Drop-off Location
                      </Text>
                      <Text style={styles.locationText}>
                        {activeOrder.dropOffLocation.address}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Customer Note Section */}
            {activeOrder.note && (
              <>
                <View style={styles.dividerLine} />
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={20}
                      color="#00AA66"
                    />
                    <Text style={styles.sectionTitle}>Customer Note</Text>
                  </View>
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>{activeOrder.note}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.dividerLine} />

            {/* Status Flow Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="git-branch" size={20} color="#00AA66" />
                <Text style={styles.sectionTitle}>Delivery Progress</Text>
              </View>

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
            </View>

            {/* Next step */}
            {status !== "delivered" && (
              <>
                <View style={styles.dividerLine} />
                <View style={styles.sectionContainer}>
                  {shouldDisableContinue() && (
                    <View style={styles.warningContainer}>
                      <Ionicons name="warning" size={20} color="#FF6B35" />
                      <Text style={styles.warningText}>
                        Please mark all destinations as delivered before
                        completing the order
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      (updatingStatus || shouldDisableContinue()) &&
                        styles.actionBtnDisabled,
                    ]}
                    onPress={onNextStatus}
                    disabled={updatingStatus || shouldDisableContinue()}
                  >
                    {updatingStatus ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={[styles.actionText, { marginLeft: 8 }]}>
                          Updating...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.actionText}>
                        Continue to Next Step
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
      </Animated.View>
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
  noteContainer: {
    marginTop: 16,
    backgroundColor: "#E6F7EF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C2F2D0",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  noteHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00AA66",
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },
  // New detailed styles
  sectionContainer: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  userDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
  },
  orderDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statusText: {
    color: "#00AA66",
  },
  amountText: {
    color: "#00AA66",
    fontSize: 16,
  },
  urgentText: {
    color: "#FF6B35",
    fontSize: 12,
  },
  normalText: {
    color: "#666",
    fontSize: 12,
  },
  locationContainer: {
    paddingLeft: 8,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  locationIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  locationConnector: {
    width: 2,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginLeft: 11,
    marginVertical: 4,
  },
  etaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  etaText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  etaOnTimeText: {
    color: "#00AA66",
  },
  etaLateText: {
    color: "#FF3B30",
  },
  contactCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  contactRole: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  contactDetails: {
    gap: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  markDeliveredBtn: {
    backgroundColor: "#00AA66",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  markDeliveredBtnDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  markDeliveredText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#FF6B35",
    fontWeight: "500",
  },
});
