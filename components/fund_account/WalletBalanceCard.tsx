import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82; // globally downscale sizes ~18%
const rs = (n: number) => RFValue((n - 2) * UI_SCALE);

interface WalletBalanceCardProps {
  balance: string | number;
}

export default function WalletBalanceCard({ balance }: WalletBalanceCardProps) {
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };
  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel} allowFontScaling={false}>
          Wallet Balance
        </Text>
        <TouchableOpacity
          style={styles.addMoneyButton}
          onPress={() => router.push("/payment/methods")}
        >
          <Text style={styles.addMoneyText} allowFontScaling={false}>
            + add option
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.balanceAmount} allowFontScaling={false}>
        ₦{formatAmount(Number(balance))}
      </Text>
      <Text style={styles.balanceSubtext} allowFontScaling={false}>
        Available for transactions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: "#00B624",
    borderRadius: rs(16),
    padding: rs(24),
    marginBottom: rs(24),
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(16),
  },
  balanceLabel: {
    fontSize: rs(16),
    color: "rgba(255, 255, 255, 0.8)",
  },
  addMoneyButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(20),
  },
  addMoneyText: {
    color: "#fff",
    fontSize: rs(14),
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: rs(33),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: rs(4),
  },
  balanceSubtext: {
    fontSize: rs(14),
    color: "rgba(255, 255, 255, 0.7)",
  },
});
