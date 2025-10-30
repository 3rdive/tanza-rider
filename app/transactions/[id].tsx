import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { transactionService, ITransactionDetail } from "../../lib/api";

const TransactionDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<ITransactionDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionDetail = async () => {
    if (!id) {
      setError("Transaction ID not found");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionService.getById(id as string);

      if (response.success && response.data) {
        setTransaction(response.data);
      } else {
        setError(response.message || "Failed to fetch transaction details");
      }
    } catch (err: any) {
      console.error("Error fetching transaction details:", err);
      setError(
        err?.response?.data?.message || "Failed to load transaction details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getTransactionTypeLabel = (type: string): string => {
    switch (type) {
      case "ORDER":
        return "Order Payment";
      case "ORDER_REWARD":
        return "Order Reward";
      case "DEPOSIT":
        return "Deposit";
      case "WITHDRAWAL":
        return "Withdrawal";
      default:
        return type;
    }
  };

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case "ORDER":
        return "bicycle";
      case "ORDER_REWARD":
        return "gift";
      case "DEPOSIT":
        return "arrow-down-circle";
      case "WITHDRAWAL":
        return "arrow-up-circle";
      default:
        return "wallet";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "complete":
        return "#00B624";
      case "failed":
        return "#ef4444";
      case "refunded":
        return "#f59e0b";
      default:
        return "#64748b";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "complete":
        return "#dcfce7";
      case "failed":
        return "#fee2e2";
      case "refunded":
        return "#fef3c7";
      default:
        return "#f1f5f9";
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number | string): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₦${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B624" />
          <Text style={styles.loadingText}>Loading transaction details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>
            {error || "Transaction not found"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchTransactionDetail}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getStatusBgColor(transaction.status) },
            ]}
          >
            <Ionicons
              name={getTransactionIcon(transaction.type) as any}
              size={40}
              color={getStatusColor(transaction.status)}
            />
          </View>
          <Text style={styles.amountText}>
            {formatAmount(transaction.amount)}
          </Text>
          <Text style={styles.typeText}>
            {getTransactionTypeLabel(transaction.type)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(transaction.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(transaction.status) },
              ]}
            >
              {transaction.status.charAt(0).toUpperCase() +
                transaction.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Transaction Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {transaction.id}
            </Text>
          </View>

          {transaction.reference && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {transaction.reference}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>
              {formatDate(transaction.createdAt)}
            </Text>
          </View>

          {transaction.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={[styles.infoValue, styles.descriptionText]}>
                {transaction.description}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={[styles.infoValue, styles.amountValue]}>
              {formatAmount(transaction.amount)}
            </Text>
          </View>
        </View>

        {/* Order Details - Only show if orderId exists */}
        {transaction.orderId && transaction.order && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {transaction.orderId}
              </Text>
            </View>

            {transaction.order.vehicleType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vehicle Type</Text>
                <Text style={[styles.infoValue, styles.capitalizeText]}>
                  {transaction.order.vehicleType}
                </Text>
              </View>
            )}

            {transaction.order.userOrderRole && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Your Role</Text>
                <Text style={[styles.infoValue, styles.capitalizeText]}>
                  {transaction.order.userOrderRole}
                </Text>
              </View>
            )}

            {transaction.order.deliveryFee && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Delivery Fee</Text>
                <Text style={styles.infoValue}>
                  {formatAmount(transaction.order.deliveryFee)}
                </Text>
              </View>
            )}

            {transaction.order.serviceChargeAmount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service Charge</Text>
                <Text style={styles.infoValue}>
                  {formatAmount(transaction.order.serviceChargeAmount)}
                </Text>
              </View>
            )}

            {transaction.order.totalAmount && (
              <View style={[styles.infoRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  {formatAmount(transaction.order.totalAmount)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {
              Alert.alert(
                "Need Help?",
                "Contact our support team for assistance with this transaction.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Contact Support",
                    onPress: () => router.push("/profile/help-support"),
                  },
                ]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color="#00B624" />
            <Text style={styles.helpButtonText}>
              Need help with this transaction?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00B624",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  amountText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  typeText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  descriptionText: {
    flex: 2,
  },
  amountValue: {
    color: "#00B624",
    fontWeight: "600",
  },
  capitalizeText: {
    textTransform: "capitalize",
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#f1f5f9",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00B624",
  },
  helpSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    color: "#00B624",
    fontWeight: "600",
  },
});

export default TransactionDetailScreen;
