import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const BalanceSummary = ({
  availableBalance,
  totalExpenditure,
}: {
  availableBalance: number;
  totalExpenditure: number;
}) => {
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.amount}>₦{formatAmount(availableBalance)}</Text>
        <Text style={styles.label}>Available Balance</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.amount}>₦{formatAmount(totalExpenditure)}</Text>
        <Text style={styles.label}>Total Expend</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#EAF6EF",
    borderWidth: 1,
    borderColor: "#6CCF8E",
    borderRadius: 10,
    width: "40%",
    paddingVertical: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  amount: {
    fontSize: 26,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  label: {
    fontSize: 16,
    color: "#4A4A4A",
    marginTop: 8,
  },
});
