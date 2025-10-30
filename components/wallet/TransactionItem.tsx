import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => router.push(`/transactions/${transaction.id}`)}
    >
      <View style={styles.transactionIcon}>
        <Ionicons
          name={getTransactionIcon(transaction.type) as any}
          size={20}
          color={getTransactionColor(transaction.type, transaction.amount)}
        />
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionDate}>
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
          {transaction.amount > 0 ? "+" : ""}₦
          {Math.abs(transaction.amount).toLocaleString()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                transaction.status === "complete"
                  ? "#dcfce7"
                  : transaction.status === "refunded"
                  ? "#fef3c7"
                  : "#fee2e2",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  transaction.status === "complete"
                    ? "#16a34a"
                    : transaction.status === "refunded"
                    ? "#d97706"
                    : "#dc2626",
              },
            ]}
          >
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
