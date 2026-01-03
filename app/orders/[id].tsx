import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { orderService, IOrderDetail } from "@/lib/api";

import { useTheme } from "@/context/ThemeContext";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [order, setOrder] = useState<IOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingHorizontal: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    orderIdLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    orderId: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "right",
      flex: 1,
      marginLeft: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
    locationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    locationIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    locationDetails: {
      flex: 1,
    },
    locationLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    locationAddress: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    routeLine: {
      width: 2,
      height: 24,
      backgroundColor: colors.border,
      marginLeft: 19,
      marginVertical: 8,
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    priceLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    priceValue: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primary,
    },
    noteText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontStyle: "italic",
    },
    trackingItem: {
      flexDirection: "row",
      marginBottom: 20,
    },
    trackingIconContainer: {
      width: 24,
      alignItems: "center",
      marginRight: 12,
    },
    trackingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginTop: 4,
    },
    trackingLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
      marginTop: 4,
    },
    trackingContent: {
      flex: 1,
    },
    trackingHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    trackingStatus: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    trackingTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    trackingNote: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    trackingDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    riderHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
  });

  // Prevent screenshots (best-effort)
  useEffect(() => {
    const preventScreenshot = async () => {
      try {
        await activateKeepAwakeAsync("prevent-screenshot");
      } catch {
        // No-op: not available on some platforms
        console.log("Screenshot prevention not available");
      }
    };

    preventScreenshot();

    return () => {
      try {
        deactivateKeepAwake("prevent-screenshot");
      } catch {
        // ignore
      }
    };
  }, []);

  const fetchOrderDetail = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      if (!id) {
        setError("Missing order id");
        return;
      }

      const response = await orderService.getOrderById(id as string);
      setOrder(response?.data ?? null);
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load order details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    fetchOrderDetail(true);
  };

  const safeToLower = (s?: string) => (s ? s.toLowerCase() : "");

  const getStatusColor = (status?: string) => {
    switch (safeToLower(status)) {
      case "delivered":
        return colors.success;
      case "cancelled":
        return colors.error;
      case "picked_up":
      case "accepted":
        return "#FFA500";
      case "transit":
        return "#2196F3";
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (safeToLower(status)) {
      case "delivered":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      case "picked_up":
        return "cube";
      case "accepted":
        return "hand-left";
      case "transit":
        return "car";
      default:
        return "ellipse";
    }
  };

  const formatStatus = (status?: string) => {
    if (!status) return "Pending";
    return status
      .split("_")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
      .join(" ");
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentStatus = () => {
    const tracking = order?.orderTracking;
    if (!Array.isArray(tracking) || tracking.length === 0) {
      return "pending";
    }
    // guard each element for status
    const last = tracking[tracking.length - 1];
    return last?.status ?? "pending";
  };

  const isCompleted = () => {
    const status = safeToLower(getCurrentStatus());
    return status === "delivered" || status === "cancelled";
  };

  // Early UI states
  if (loading && !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchOrderDetail()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="document-outline"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.errorTitle}>Order Not Found</Text>
      </View>
    );
  }

  const completed = isCompleted();

  // Helper safe getters for numbers and strings
  const safeNumber = (n?: number | null) => (typeof n === "number" ? n : 0);
  const safeString = (s?: string | null) => (s ? s : "N/A");

  // Delivery destinations (may be undefined)
  const deliveryDestinations = Array.isArray(order.deliveryDestinations)
    ? order.deliveryDestinations
    : [];

  // Order tracking (guarded)
  const orderTracking = Array.isArray(order.orderTracking)
    ? order.orderTracking
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Order ID & Status */}
          <View style={styles.card}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderIdLabel}>Order ID</Text>
                <Text style={styles.orderId}>
                  #{safeString(order.id).slice(0, 8)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${getStatusColor(getCurrentStatus())}15`,
                  },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(getCurrentStatus()) as any}
                  size={16}
                  color={getStatusColor(getCurrentStatus())}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(getCurrentStatus()) },
                  ]}
                >
                  {formatStatus(getCurrentStatus())}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {formatDate(order.createdAt)}
              </Text>
            </View>

            {order.eta && !completed && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ETA</Text>
                <Text style={styles.infoValue}>{safeString(order.eta)}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {order.userOrderRole === "sender" ? "Sender" : "Recipient"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Type</Text>
              <Text style={styles.infoValue}>
                {safeString(order.vehicleType).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Location Details - Only show for non-completed orders */}
          {!completed && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Delivery Route</Text>

              <View style={styles.locationItem}>
                <View style={styles.locationIconContainer}>
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>Pickup Location</Text>
                  <Text style={styles.locationAddress}>
                    {order.pickUpLocation?.address ??
                      "Pickup address unavailable"}
                  </Text>
                </View>
              </View>

              <View style={styles.routeLine} />

              {/* Multiple Delivery Destinations */}
              {order.hasMultipleDeliveries &&
              deliveryDestinations.length > 0 ? (
                <>
                  {deliveryDestinations.map((destination, index) => (
                    <React.Fragment key={destination?.id ?? index}>
                      <View style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                          <Ionicons
                            name="flag"
                            size={20}
                            color={
                              destination?.delivered
                                ? colors.success
                                : colors.error
                            }
                          />
                        </View>
                        <View style={styles.locationDetails}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <Text style={styles.locationLabel}>
                              Drop-off {index + 1}
                            </Text>
                            {destination?.delivered && (
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={colors.success}
                              />
                            )}
                          </View>
                          <Text style={styles.locationAddress}>
                            {destination?.dropOffLocation?.address ??
                              "Address unavailable"}
                          </Text>
                          {destination?.recipient && (
                            <Text
                              style={[
                                styles.locationLabel,
                                { marginTop: 6, color: colors.textSecondary },
                              ]}
                            >
                              {destination.recipient.name ?? "Unknown"} •{" "}
                              {destination.recipient.phone ?? "Unknown"}
                            </Text>
                          )}
                          {typeof destination?.distanceFromPickupKm ===
                            "number" && (
                            <Text
                              style={[
                                styles.locationLabel,
                                { marginTop: 4, color: colors.textSecondary },
                              ]}
                            >
                              {destination.distanceFromPickupKm.toFixed(2)} km
                              from pickup • ₦
                              {(destination.deliveryFee ?? 0).toLocaleString()}
                            </Text>
                          )}
                          {destination?.deliveredAt && (
                            <Text
                              style={[
                                styles.locationLabel,
                                { marginTop: 4, color: colors.success },
                              ]}
                            >
                              Delivered on{" "}
                              {new Date(
                                destination.deliveredAt
                              ).toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      {index < deliveryDestinations.length - 1 && (
                        <View style={styles.routeLine} />
                      )}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <View style={styles.locationItem}>
                  <View style={styles.locationIconContainer}>
                    <Ionicons name="flag" size={20} color={colors.error} />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>Drop-off Location</Text>
                    <Text style={styles.locationAddress}>
                      {order.dropOffLocation?.address ??
                        "Drop-off address unavailable"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Pricing Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pricing Breakdown</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>
                ₦{safeNumber(order.deliveryFee).toLocaleString()}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Charge</Text>
              <Text style={styles.priceValue}>
                ₦{safeNumber(order.serviceChargeAmount).toLocaleString()}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Payment Method</Text>
              <Text
                style={[
                  styles.priceValue,
                  { color: order.isCashPayment ? "#FFA500" : colors.text },
                ]}
              >
                {order.isCashPayment ? "Pay on Delivery" : "Prepaid"}
              </Text>
            </View>

            {safeNumber(order.cashAmountToReceive) > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cash to Collect</Text>
                <Text style={[styles.priceValue, { color: colors.error }]}>
                  ₦{safeNumber(order.cashAmountToReceive).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₦{safeNumber(order.totalAmount).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {order.noteForRider && order.noteForRider.trim() !== "" && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Note for Rider</Text>
              <Text style={styles.noteText}>{order.noteForRider}</Text>
            </View>
          )}

          {/* Order Tracking */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Timeline</Text>

            {orderTracking.length === 0 && (
              <Text style={styles.infoLabel}>No tracking events yet.</Text>
            )}

            {orderTracking
              .slice()
              .reverse()
              .map((tracking, index, arr) => {
                const isLast = index < arr.length - 1;
                const statusColor = getStatusColor(tracking?.status);
                return (
                  <View key={tracking?.id ?? index} style={styles.trackingItem}>
                    <View style={styles.trackingIconContainer}>
                      <View
                        style={[
                          styles.trackingDot,
                          { backgroundColor: statusColor },
                        ]}
                      />
                      {isLast && <View style={styles.trackingLine} />}
                    </View>
                    <View style={styles.trackingContent}>
                      <View style={styles.trackingHeader}>
                        <Text style={styles.trackingStatus}>
                          {formatStatus(tracking?.status)}
                        </Text>
                        <Text style={styles.trackingTime}>
                          {tracking?.createdAt
                            ? new Date(tracking.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </Text>
                      </View>
                      {tracking?.note && (
                        <Text style={styles.trackingNote}>{tracking.note}</Text>
                      )}
                      <Text style={styles.trackingDate}>
                        {formatDate(tracking?.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>

          {/* Rider Info */}
          {order.riderAssigned && (
            <View style={styles.card}>
              <View style={styles.riderHeader}>
                <Ionicons name="bicycle" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>Rider Information</Text>
              </View>
              {completed && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rider Rewarded</Text>
                  <Text style={styles.infoValue}>
                    {order.hasRewardedRider ? "Yes ⭐" : "No"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
