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
import { tzColors } from "@/theme/color";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<IOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent screenshots
  useEffect(() => {
    const preventScreenshot = async () => {
      try {
        await activateKeepAwakeAsync("prevent-screenshot");
      } catch {
        console.log("Screenshot prevention not available");
      }
    };

    preventScreenshot();

    return () => {
      deactivateKeepAwake("prevent-screenshot");
    };
  }, []);

  const fetchOrderDetail = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await orderService.getOrderById(id as string);
      setOrder(response.data);
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError(err?.response?.data?.message || "Failed to load order details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    fetchOrderDetail(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "#00B624";
      case "cancelled":
        return "#FF4C4C";
      case "picked_up":
      case "accepted":
        return "#FFA500";
      case "transit":
        return "#2196F3";
      default:
        return "#999";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
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

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentStatus = () => {
    if (!order?.orderTracking || order.orderTracking.length === 0) {
      return "pending";
    }
    return order.orderTracking[order.orderTracking.length - 1].status;
  };

  const isCompleted = () => {
    const status = getCurrentStatus().toLowerCase();
    return status === "delivered" || status === "cancelled";
  };

  if (loading && !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={tzColors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF4C4C" />
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
        <Ionicons name="document-outline" size={64} color="#ccc" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
      </View>
    );
  }

  const completed = isCompleted();

  return (
    <SafeAreaView>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#222" />
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
              colors={[tzColors.primary]}
              tintColor={tzColors.primary}
            />
          }
        >
          {/* Order ID & Status */}
          <View style={styles.card}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderIdLabel}>Order ID</Text>
                <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
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
                <Text style={styles.infoValue}>{order.eta}</Text>
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
                {order.vehicleType.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Location Details - Only show for non-completed orders */}
          {!completed && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Delivery Route</Text>

              <View style={styles.locationItem}>
                <View style={styles.locationIconContainer}>
                  <Ionicons
                    name="navigate"
                    size={20}
                    color={tzColors.primary}
                  />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>Pickup Location</Text>
                  <Text style={styles.locationAddress}>
                    {order.pickUpLocation.address}
                  </Text>
                </View>
              </View>

              <View style={styles.routeLine} />

              {/* Multiple Delivery Destinations */}
              {order.hasMultipleDeliveries &&
              order.deliveryDestinations &&
              order.deliveryDestinations.length > 0 ? (
                <>
                  {order.deliveryDestinations.map((destination, index) => (
                    <React.Fragment key={destination.id}>
                      <View style={styles.locationItem}>
                        <View style={styles.locationIconContainer}>
                          <Ionicons
                            name="flag"
                            size={20}
                            color={
                              destination.delivered ? "#00B624" : "#FF4C4C"
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
                            {destination.delivered && (
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#00B624"
                              />
                            )}
                          </View>
                          <Text style={styles.locationAddress}>
                            {destination.dropOffLocation.address}
                          </Text>
                          <Text
                            style={[
                              styles.locationLabel,
                              { marginTop: 6, color: "#666" },
                            ]}
                          >
                            {destination.recipient.name} •{" "}
                            {destination.recipient.phone}
                          </Text>
                          <Text
                            style={[
                              styles.locationLabel,
                              { marginTop: 4, color: "#666" },
                            ]}
                          >
                            {destination.distanceFromPickupKm.toFixed(2)} km
                            from pickup • ₦
                            {destination.deliveryFee.toLocaleString()}
                          </Text>
                          {destination.deliveredAt && (
                            <Text
                              style={[
                                styles.locationLabel,
                                { marginTop: 4, color: "#00B624" },
                              ]}
                            >
                              Delivered on{" "}
                              {new Date(
                                destination.deliveredAt,
                              ).toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      {index < order.deliveryDestinations.length - 1 && (
                        <View style={styles.routeLine} />
                      )}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <View style={styles.locationItem}>
                  <View style={styles.locationIconContainer}>
                    <Ionicons name="flag" size={20} color="#FF4C4C" />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationLabel}>Drop-off Location</Text>
                    <Text style={styles.locationAddress}>
                      {order.dropOffLocation.address}
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
                ₦{order.deliveryFee.toLocaleString()}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Charge</Text>
              <Text style={styles.priceValue}>
                ₦{order.serviceChargeAmount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₦{order.totalAmount.toLocaleString()}
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

            {order.orderTracking
              .slice()
              .reverse()
              .map((tracking, index) => (
                <View key={tracking.id} style={styles.trackingItem}>
                  <View style={styles.trackingIconContainer}>
                    <View
                      style={[
                        styles.trackingDot,
                        {
                          backgroundColor: getStatusColor(tracking.status),
                        },
                      ]}
                    />
                    {index < order.orderTracking.length - 1 && (
                      <View style={styles.trackingLine} />
                    )}
                  </View>
                  <View style={styles.trackingContent}>
                    <View style={styles.trackingHeader}>
                      <Text style={styles.trackingStatus}>
                        {formatStatus(tracking.status)}
                      </Text>
                      <Text style={styles.trackingTime}>
                        {new Date(tracking.createdAt).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>
                    </View>
                    {tracking.note && (
                      <Text style={styles.trackingNote}>{tracking.note}</Text>
                    )}
                    <Text style={styles.trackingDate}>
                      {formatDate(tracking.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Rider Info */}
          {order.riderAssigned && (
            <View style={styles.card}>
              <View style={styles.riderHeader}>
                <Ionicons name="bicycle" size={24} color={tzColors.primary} />
                <Text style={styles.sectionTitle}>Rider Information</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rider Assigned</Text>
                <Text style={styles.infoValue}>
                  {order.riderAssignedAt
                    ? formatDate(order.riderAssignedAt)
                    : "Yes"}
                </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
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
    backgroundColor: "#e0e0e0",
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
    color: "#777",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#777",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#222",
    lineHeight: 20,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "#e0e0e0",
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
    color: "#777",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: tzColors.primary,
  },
  noteText: {
    fontSize: 14,
    color: "#555",
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
    backgroundColor: "#e0e0e0",
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
    color: "#222",
  },
  trackingTime: {
    fontSize: 12,
    color: "#777",
  },
  trackingNote: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  trackingDate: {
    fontSize: 12,
    color: "#999",
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#777",
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: tzColors.primary,
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
