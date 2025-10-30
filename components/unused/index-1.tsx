"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { useDeliveryRequest } from "@/hooks/useDeliveryRequest";

interface RiderStats {
  todayEarnings: number;
  completedJobs: number;
  totalDistance: number;
  rating: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: "pending" | "accepted" | "in_transit" | "delivered";
  estimatedTime: string;
  earning: number;
  distance: string;
}

const demoPendingOrders: PendingOrder[] = [
  {
    id: "ord_001",
    orderNumber: "TZ001234",
    customerName: "Alice Cooper",
    pickupLocation: "Ikoyi, Lagos",
    dropoffLocation: "Ajah, Lagos",
    status: "accepted",
    estimatedTime: "25 min",
    earning: 2800,
    distance: "15.3 km",
  },
  {
    id: "ord_002",
    orderNumber: "TZ001235",
    customerName: "David Wilson",
    pickupLocation: "Maryland, Lagos",
    dropoffLocation: "Festac, Lagos",
    status: "in_transit",
    estimatedTime: "12 min",
    earning: 2200,
    distance: "11.8 km",
  },
  {
    id: "ord_003",
    orderNumber: "TZ001236",
    customerName: "Emma Davis",
    pickupLocation: "Gbagada, Lagos",
    dropoffLocation: "Yaba, Lagos",
    status: "pending",
    estimatedTime: "30 min",
    earning: 1800,
    distance: "8.5 km",
  },
  {
    id: "ord_004",
    orderNumber: "TZ001237",
    customerName: "John Smith",
    pickupLocation: "Apapa, Lagos",
    dropoffLocation: "Mushin, Lagos",
    status: "pending",
    estimatedTime: "20 min",
    earning: 1500,
    distance: "6.2 km",
  },
];

export default function RiderHomeScreen() {
  const { isOnline, goOnline } = useDeliveryRequest();

  const [isLoading, setIsLoading] = useState(true);
  const [riderStats, setRiderStats] = useState<RiderStats>({
    todayEarnings: 0,
    completedJobs: 0,
    totalDistance: 0,
    rating: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [notifications] = useState(3); // Demo notification count
  const [activeOrder, setActiveOrder] = useState<PendingOrder | null>(null);
  const [documentsUploaded] = useState(false); // Demo: set to false to show caution

  const riderName = "John Rider";
  const ordersPerPage = 4;

  useEffect(() => {
    setTimeout(() => {
      setRiderStats({
        todayEarnings: 15750,
        completedJobs: 8,
        totalDistance: 125.6,
        rating: 4.8,
      });
      setPendingOrders(demoPendingOrders);
      setActiveOrder(
        demoPendingOrders.find(
          (order) =>
            order.status === "accepted" || order.status === "in_transit"
        ) || null
      );
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleToggleOnline = (value: boolean) => {
    goOnline(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "#00B624";
      case "in_transit":
        return "#f59e0b";
      case "pending":
        return "#6b7280";
      case "delivered":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return "✅";
      case "in_transit":
        return "🚚";
      case "pending":
        return "⏳";
      case "delivered":
        return "📦";
      default:
        return "📋";
    }
  };

  const paginatedOrders = pendingOrders.slice(
    currentPage * ordersPerPage,
    (currentPage + 1) * ordersPerPage
  );
  const totalPages = Math.ceil(pendingOrders.length / ordersPerPage);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B624" />
          <Text style={styles.loadingText}>Loading rider dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{riderName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
              {notifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{notifications}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Online/Offline Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>You are</Text>
              <Text
                style={[
                  styles.statusText,
                  { color: isOnline ? "#00B624" : "#ef4444" },
                ]}
              >
                {isOnline ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: "#f3f4f6", true: "#dcfce7" }}
              thumbColor={isOnline ? "#00B624" : "#9ca3af"}
              ios_backgroundColor="#f3f4f6"
            />
          </View>
          <Text style={styles.statusSubtext}>
            {isOnline
              ? "Ready to receive delivery requests"
              : "Turn on to start receiving requests"}
          </Text>
        </View>

        {/* Caution Section for Document Verification */}
        {!documentsUploaded && (
          <View style={styles.cautionCard}>
            <View style={styles.cautionHeader}>
              <Text style={styles.cautionIcon}>⚠️</Text>
              <Text style={styles.cautionTitle}>Documents Required</Text>
            </View>
            <Text style={styles.cautionText}>
              You can&#39;t receive orders until you&#39;ve uploaded your
              required documents (driver&#39;s license, insurance, etc.)
            </Text>
            <TouchableOpacity style={styles.cautionButton} onPress={() => {}}>
              <Text style={styles.cautionButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Order Section */}
        {activeOrder && (
          <View style={styles.activeOrderSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Order</Text>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => {}}
              >
                <Text style={styles.navigateText}>View Details</Text>
                <Text style={styles.navigateArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activeOrderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>
                    {activeOrder.orderNumber}
                  </Text>
                  <Text style={styles.customerName}>
                    {activeOrder.customerName}
                  </Text>
                </View>
                <View style={styles.orderStatus}>
                  <Text style={styles.statusIcon}>
                    {getStatusIcon(activeOrder.status)}
                  </Text>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: getStatusColor(activeOrder.status) },
                    ]}
                  >
                    {activeOrder.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.locationText}>
                  📍 {activeOrder.pickupLocation}
                </Text>
                <Text style={styles.locationText}>
                  📍 {activeOrder.dropoffLocation}
                </Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDistance}>
                  {activeOrder.distance} • {activeOrder.estimatedTime}
                </Text>
                <Text style={styles.orderEarning}>
                  ₦{activeOrder.earning.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₦{riderStats.todayEarnings.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Today&#39;s Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{riderStats.completedJobs}</Text>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{riderStats.totalDistance}</Text>
            <Text style={styles.statLabel}>Distance Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>⭐ {riderStats.rating}</Text>
            <Text style={styles.statLabel}>Your Rating</Text>
          </View>
        </View>

        {/* Pending Orders */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Orders</Text>
            <Text style={styles.orderCount}>
              {pendingOrders.length} order
              {pendingOrders.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {paginatedOrders.length > 0 ? (
            <>
              {paginatedOrders.map((order) => (
                <TouchableOpacity key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderNumber}>
                        {order.orderNumber}
                      </Text>
                      <Text style={styles.customerName}>
                        {order.customerName}
                      </Text>
                    </View>
                    <View style={styles.orderStatus}>
                      <Text style={styles.statusIcon}>
                        {getStatusIcon(order.status)}
                      </Text>
                      <Text
                        style={[
                          styles.statusLabel,
                          { color: getStatusColor(order.status) },
                        ]}
                      >
                        {order.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={styles.locationText}>
                      📍 {order.pickupLocation}
                    </Text>
                    <Text style={styles.locationText}>
                      📍 {order.dropoffLocation}
                    </Text>
                  </View>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderDistance}>
                      {order.distance} • {order.estimatedTime}
                    </Text>
                    <Text style={styles.orderEarning}>
                      ₦{order.earning.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === 0 && styles.disabledButton,
                    ]}
                    onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <Text style={styles.paginationText}>Previous</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>
                    {currentPage + 1} of {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === totalPages - 1 && styles.disabledButton,
                    ]}
                    onPress={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                    disabled={currentPage === totalPages - 1}
                  >
                    <Text style={styles.paginationText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateText}>No pending orders</Text>
              <Text style={styles.emptyStateSubtext}>
                {isOnline
                  ? "New orders will appear here"
                  : "Go online to receive orders"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  profileButton: {
    width: 40,
    height: 40,
    backgroundColor: "#00B624",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    fontSize: 20,
    color: "#fff",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statusSubtext: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  ordersSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  orderCount: {
    fontSize: 14,
    color: "#666",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  customerName: {
    fontSize: 14,
    color: "#666",
  },
  orderStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  // statusLabel: {
  // fontSize: 12,
  // fontWeight: "600",
  // textTransform: "capitalize",
  // },
  orderDetails: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDistance: {
    fontSize: 12,
    color: "#666",
  },
  orderEarning: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00B624",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  paginationButton: {
    backgroundColor: "#00B624",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  paginationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  pageInfo: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  cautionCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  cautionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cautionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cautionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#92400e",
  },
  cautionText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
    marginBottom: 16,
  },
  cautionButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cautionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  activeOrderSection: {
    marginBottom: 20,
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00B624",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  navigateText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  navigateArrow: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  activeOrderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#00B624",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
