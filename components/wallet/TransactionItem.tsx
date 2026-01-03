import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  TransactionType,
  TransactionStatus,
  getTransactionIcon,
  getTransactionColor,
  formatDate,
} from "../../lib/walletConstants";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  status: TransactionStatus;
  orderId?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  function getAmountSign(transaction: any): string {
    if (transaction.apiType === "FAILED_PAYOUT") {
      return "";
    }
    // DEPOSIT and REFUND add money to wallet (positive)
    if (
      transaction.type === "reward" ||
      transaction.type === "refund" ||
      transaction.type === "deposit"
    ) {
      return "+";
    }
    // ORDER and WITHDRAWAL remove money from wallet (negative)
    return "-";
  }

  // Dynamic styles for dark mode
  const dynamicStyles = StyleSheet.create({
    transactionItem: {
      backgroundColor: isDark ? "#18181b" : "#fff",
      borderBottomColor: isDark ? "#27272a" : "#f1f5f9",
    },
    transactionIcon: {
      backgroundColor: isDark ? "#27272a" : "#f8fafc",
    },
    transactionDescription: {
      color: isDark ? "#f4f4f5" : "#000",
    },
    transactionDate: {
      color: isDark ? "#a1a1aa" : "#64748b",
    },
    statusBadge: {
      backgroundColor:
        transaction.status === "complete"
          ? isDark
            ? "#14532d"
            : "#dcfce7"
          : transaction.status === "refunded"
          ? isDark
            ? "#78350f"
            : "#fef3c7"
          : isDark
          ? "#7f1d1d"
          : "#fee2e2",
    },
    statusText: {
      color:
        transaction.status === "complete"
          ? isDark
            ? "#bbf7d0"
            : "#16a34a"
          : transaction.status === "refunded"
          ? isDark
            ? "#fde68a"
            : "#d97706"
          : isDark
          ? "#fecaca"
          : "#dc2626",
    },
  });

  return (
    <TouchableOpacity
      style={[styles.transactionItem, dynamicStyles.transactionItem]}
      onPress={() => router.push(`/transactions/${transaction.id}`)}
    >
      <View style={[styles.transactionIcon, dynamicStyles.transactionIcon]}>
        <Ionicons
          name={getTransactionIcon(transaction.type) as any}
          size={20}
          color={getTransactionColor(transaction.type, transaction.amount)}
        />
      </View>

      <View style={styles.transactionDetails}>
        <Text
          style={[
            styles.transactionDescription,
            dynamicStyles.transactionDescription,
          ]}
        >
          {transaction.description}
        </Text>
        <Text style={[styles.transactionDate, dynamicStyles.transactionDate]}>
          {formatDate(transaction.date)}
        </Text>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            {
              color: getTransactionColor(transaction.type, transaction.amount),
            },
          ]}
        >
          {getAmountSign(transaction)}₦
          {Math.abs(transaction.amount).toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, dynamicStyles.statusBadge]}>
          <Text style={[styles.statusText, dynamicStyles.statusText]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: "#64748b",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
});

export default TransactionItem;
