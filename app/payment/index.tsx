// FundAccountScreen.tsx
import { PaystackButton } from "@/components/fund_account/paystack-button";
import { CustomPaystackProvider } from "@/components/fund_account/paystack-provider";
import { walletService, IVirtualAccount } from "@/lib/api";
import { useVirtualAccount } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82; // downscale globally
const rs = (n: number) => RFValue((n - 2) * UI_SCALE);

export default function FundAccountScreen() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const { virtualAccount, saveVirtualAccount } = useVirtualAccount();
  const [loading, setLoading] = useState(true);

  const accountNumber = virtualAccount?.accountNumber || "••••••••••";
  const bankName = virtualAccount?.bankName || "Loading bank...";
  const accountName = virtualAccount?.accountName || "Loading name...";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await walletService.getVirtualAccount();
        if (resp?.success) {
          saveVirtualAccount(resp.data as IVirtualAccount);
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Failed to load virtual account";
        Alert.alert("Error", msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    Clipboard.setString(text);
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

  const handlePaymentMethod = (method: any) => {
    setSelectedMethod(method);

    switch (method) {
      case "bank":
        // Bank transfer is already shown
        break;
      case "card":
        // navigation.navigate('CreditCardPayment');
        break;
      case "google":
        Alert.alert("Google Pay", "Google Pay integration coming soon");
        break;
      case "apple":
        Alert.alert("Apple Pay", "Apple Pay integration coming soon");
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomPaystackProvider>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fund Account</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Choose how you&#39;d like to add money to your wallet
          </Text>

          {/* Bank Transfer Option */}
          <View style={styles.paymentOption}>
            <View style={styles.optionHeader}>
              <View style={styles.optionIconContainer}>
                <Text style={styles.optionIcon}>🏦</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Bank Transfer</Text>
                <Text style={styles.optionSubtitle}>Free • Instant</Text>
              </View>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handlePaymentMethod("bank")}
              >
                <Text style={styles.selectButtonText}>Use This</Text>
              </TouchableOpacity>
            </View>

            {/* Account Details */}
            <View style={styles.accountDetails}>
              <Text style={styles.accountDetailsTitle}>
                Transfer to this account:
              </Text>

              {loading ? (
                <View style={{ paddingVertical: rs(12) }}>
                  <ActivityIndicator />
                </View>
              ) : (
                <>
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Account Number</Text>
                    <View style={styles.accountValueContainer}>
                      <Text style={styles.accountValue}>{accountNumber}</Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(accountNumber, "Account number")}
                        style={styles.copyButton}
                      >
                        <Text style={styles.copyText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Bank Name</Text>
                    <View style={styles.accountValueContainer}>
                      <Text style={styles.accountValue}>{bankName}</Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(bankName, "Bank name")}
                        style={styles.copyButton}
                      >
                        <Text style={styles.copyText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Account Name</Text>
                    <Text style={styles.accountValue}>{accountName}</Text>
                  </View>


                </>
              )}

              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  💡 This is your dedicated account. Any transfer to this
                  account will be automatically added to your wallet. It may
                  take up to 3Mins to process.
                </Text>
              </View>
            </View>
          </View>

          <PaystackButton />
          {/* Security Note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>🔒 Secure & Protected</Text>
            <Text style={styles.securityText}>
              All transactions are encrypted and protected by bank-level
              security. Your financial information is never stored on our
              servers.
            </Text>
          </View>
        </ScrollView>
      </CustomPaystackProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    backgroundColor: "#fff",
    borderBottomWidth: rs(1),
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    justifyContent: "center",
  },
  backArrow: {
    fontSize: rs(24),
    color: "#000",
  },
  headerTitle: {
    fontSize: rs(20),
    fontWeight: "bold",
    color: "#000",
  },
  placeholder: {
    width: rs(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: rs(20),
    paddingTop: rs(20),
  },
  subtitle: {
    fontSize: rs(16),
    color: "#666",
    marginBottom: rs(24),
    lineHeight: rs(22),
  },
  paymentOption: {
    backgroundColor: "#fff",
    borderRadius: rs(12),
    padding: rs(20),
    marginBottom: rs(16),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIconContainer: {
    width: rs(48),
    height: rs(48),
    backgroundColor: "#f0fffe",
    borderRadius: rs(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: rs(16),
  },
  optionIcon: {
    fontSize: rs(24),
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: rs(18),
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: rs(14),
    color: "#666",
  },
  selectButton: {
    backgroundColor: "#00B624",
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: rs(20),
  },
  selectButtonText: {
    color: "#fff",
    fontSize: rs(14),
    fontWeight: "600",
  },
  arrow: {
    fontSize: rs(20),
    color: "#ccc",
  },
  accountDetails: {
    marginTop: rs(20),
    paddingTop: rs(20),
    borderTopWidth: rs(1),
    borderTopColor: "#f0f0f0",
  },
  accountDetailsTitle: {
    fontSize: rs(16),
    fontWeight: "600",
    color: "#000",
    marginBottom: rs(16),
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(12),
  },
  accountLabel: {
    fontSize: rs(14),
    color: "#666",
    flex: 1,
  },
  accountValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
    justifyContent: "flex-end",
  },
  accountValue: {
    fontSize: rs(16),
    fontWeight: "600",
    color: "#000",
    marginRight: rs(8),
  },
  copyButton: {
    backgroundColor: "#f0fffe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: rs(6),
  },
  copyText: {
    fontSize: rs(12),
    color: "#00B624",
    fontWeight: "600",
  },
  noteContainer: {
    backgroundColor: "#f1fff0",
    padding: rs(12),
    borderRadius: rs(8),
    marginTop: rs(16),
  },
  noteText: {
    fontSize: rs(14),
    color: "#00B624",
    lineHeight: rs(20),
  },
  securityNote: {
    backgroundColor: "#fff",
    borderRadius: rs(12),
    padding: rs(20),
    marginTop: rs(8),
    marginBottom: rs(40),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityTitle: {
    fontSize: rs(16),
    fontWeight: "600",
    color: "#000",
    marginBottom: rs(8),
  },
  securityText: {
    fontSize: rs(14),
    color: "#666",
    lineHeight: rs(20),
  },
});
