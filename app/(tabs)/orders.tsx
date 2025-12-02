import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOrders, OrderTab } from "@/hooks/useOrders";
import { IOrderHistoryItem, orderService } from "@/lib/api";
import { useAlert } from "@/hooks/useAlert";

import { useTheme } from "@/context/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

export default function HistoryScreen() {
  const router = useRouter();
  const alert = useAlert();
  const { colors } = useTheme();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const {
    orders,
    loading,
    refreshing,
    loadingMore,
    activeTab,
    currentPage,
    totalPages,
    onRefresh,
    loadMore,
    changeTab,
  } = useOrders();

  useEffect(() => {
    // Check if tab parameter is provided in URL
    if (tab) {
      const normalizedTab =
        tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase();
      if (["Upcoming", "Ongoing", "Completed"].includes(normalizedTab)) {
        changeTab(normalizedTab as OrderTab);
        return;
      }
    }
    // Default to Ongoing if no valid tab parameter
    changeTab("Ongoing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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

  const handleOrderPress = (orderId: string) => {
    router.push(`/orders/${orderId}` as any);
  };

  const handleAccept = async (orderId: string) => {
    try {
      setAcceptingId(orderId);
      await orderService.track({
        orderId,
        note: "order has been picked up",
        status: "accepted",
      });
      // Show success alert
      alert.success({
        heading: "Order accepted",
        message: "You're now assigned to this order.",
        duration: 3000,
      });
      // Refresh current tab to reflect new status
      onRefresh();
    } catch (error) {
      console.error("Failed to accept order", error);
      alert.error({
        heading: "Failed to accept order",
        message: "Please try again.",
        duration: 4000,
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const renderOrderCard = ({ item }: { item: IOrderHistoryItem }) => {
    const isCompleted = activeTab === "Completed";
    const formattedFee = `₦${item.deliveryFee.toLocaleString()}`;
    const formattedDate = new Date(item.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOrderPress(item.id)}
        activeOpacity={0.7}
      >
        {isCompleted ? (
          <>
            {/* For completed orders, show order ID and date */}
            <View style={styles.row}>
              <Ionicons name="receipt-outline" size={16} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                Order #{item.id.slice(0, 8)}
              </Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {formattedDate}
              </Text>
            </View>
            {item.riderRewarded && (
              <View style={styles.row}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={[styles.locationText, { color: "#FFD700" }]}>
                  Rider Rewarded
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* For ongoing/upcoming orders, show pickup and dropoff */}
            <View style={styles.row}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.pickUpLocationAddress}
              </Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="flag" size={16} color="#FF4C4C" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.dropOffLocationAddress}
              </Text>
            </View>
          </>
        )}

        <View style={styles.detailsRow}>
          <View style={styles.etaContainer}>
            <Ionicons name="time-outline" size={14} color="#777" />
            <Text style={styles.etaText}>{item.eta}</Text>
          </View>
          <Text style={styles.detailValue}>{formattedFee}</Text>
        </View>

        {/* Accept action for Upcoming orders */}
        {activeTab === "Upcoming" && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item.id)}
            disabled={acceptingId === item.id}
            activeOpacity={0.8}
          >
            {acceptingId === item.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Role badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {item.userOrderRole === "sender" ? "Sender" : "Recipient"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="file-tray-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No {activeTab} Orders</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === "Upcoming"
            ? "You don't have any upcoming orders"
            : activeTab === "Ongoing"
              ? "You don't have any ongoing deliveries"
              : "You haven't completed any orders yet"}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadMore();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 90,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: colors.text },

    /* Tabs */
    tabs: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      overflow: "hidden",
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: colors.tabBackground,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: { fontWeight: "500", color: colors.primary },
    activeTabText: { color: "#fff", fontWeight: "600" },

    /* List */
    listContent: {
      paddingTop: 10,
      paddingBottom: 20,
    },

    /* Cards */
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: 14,
      marginBottom: 12,
      position: "relative",
    },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    locationText: { marginLeft: 8, color: colors.text, fontSize: 13, flex: 1 },
    detailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
      paddingTop: 6,
    },
    etaContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    etaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    detailLabel: { fontSize: 13, color: colors.textSecondary },
    detailValue: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    roleBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: colors.roleBadgeBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    roleText: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: "600",
      textTransform: "uppercase",
    },

    /* Empty State */
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
      paddingHorizontal: 40,
    },

    /* Loading States */
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
    },
    loadingMore: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
      gap: 8,
    },
    loadingMoreText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    acceptButton: {
      marginTop: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
    },
    acceptButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(["Upcoming", "Ongoing", "Completed"] as OrderTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => changeTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order List */}
      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
