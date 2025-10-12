import { walletService } from "@/lib/api";
import { rs } from "@/lib/functions";
import { useUser, useWallet } from "@/redux/hooks/hooks";
import { poppinsFonts } from "@/theme/fonts";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePaystack } from "react-native-paystack-webview";

export const PaystackButton = () => {
  const [amount, setAmount] = useState<number>(0);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { popup } = usePaystack();
  const { user } = useUser();
  const { wallet } = useWallet();
  const parsedAmount = useMemo(() => {
    const n = Number(input.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : Math.floor(n);
  }, [input]);

  const handleClose = () => {
    setSubmitting(false);
    setVisible(false);
  };
  const openPayment = () => {
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Enter amount", "Please enter a valid amount to continue.");
      return;
    }
    setSubmitting(true);
    setAmount(parsedAmount);
    // popup.newTransaction({
    //   // email: user?.email || process.env.EXPO_PUBLIC_APP_EMAIL!,
    //   reference: `TZTX-${Date.now()}`,
    //   amount: parsedAmount,
    //   onSuccess: (response) => {
    //     console.log("payment-response: ", JSON.stringify(response));

    // 		walletService.fund({ customerCode: wallet?.customerCode!, transactionReference: response.reference})
    //     handleClose();
    // 		Alert.alert("Payment successful", "Your transaction was successful.", [
    // 		 { text: "OK", onPress: () => router.replace('/(tabs)') },
    // 		]);

    //   },
    //   onCancel: () => {
    //     console.log("payment-cancelled");
    //     handleClose();
    //   },
    //   onError: (error) => {
    //     console.log("payment-error: ", error);
    //     Alert.alert(
    //       "Payment error",
    //       "Something went wrong starting the payment. Please try again."
    //     );
    //     handleClose();
    //   },
    //   onLoad: (res) => {
    //     console.log("payment-modal-loaded: ", res);
    //     handleClose();
    //   },
    // });
  };

  return (
    <View>
      <Pressable
        style={styles.button}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>More Payment Option</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Enter amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#9aa0a6"
              keyboardType="numeric"
              value={input}
              onChangeText={setInput}
              editable={!submitting}
            />
            <View style={styles.row}>
              <Pressable
                style={[styles.secondaryBtn]}
                onPress={() => setVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryBtn,
                  (!parsedAmount || submitting) && styles.disabled,
                ]}
                onPress={openPayment}
                disabled={!parsedAmount || submitting}
              >
                <Text style={styles.primaryText}>
                  {submitting ? "Please wait..." : "Next"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#00B624",
    paddingVertical: rs(12),
    marginBottom: rs(26),
    paddingHorizontal: rs(16),
    borderRadius: 10,
    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
  },
  buttonText: {
    color: "#fff",
    fontSize: rs(13),
    flex: 1,
    justifyContent: "center",
    fontFamily: poppinsFonts.semiBold,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: rs(16),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: rs(18), fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    fontSize: rs(16),
    marginBottom: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dadce0",
    paddingVertical: rs(12),
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#1f2937", fontWeight: "600" },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B624",
    paddingVertical: rs(12),
    borderRadius: 10,
    gap: 8,
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
