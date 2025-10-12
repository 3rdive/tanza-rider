import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState([
    { id: 1, bank: "UBA", info: "******2486", holderName: "Abiodun Samuel" },
    {
      id: 2,
      bank: "MasterCard",
      info: "**** **** **** 1024",
      holderName: "12/25",
    },
    { id: 3, bank: "PayPal", info: "email@example.com", holderName: "—" },
  ]);

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const deleteMethod = (id: number) => {
    setMethods(methods.filter((m) => m.id !== id));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router?.back()}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Existing Methods */}
      <Text style={styles.sectionTitle}>Your Payment Methods</Text>
      {methods.map((m) => (
        <View key={m.id} style={styles.methodCard}>
          <View style={styles.methodRow}>
            <Ionicons
              name={
                m.bank === "Visa"
                  ? "card"
                  : m.bank === "PayPal"
                  ? "logo-paypal"
                  : "cash-outline"
              }
              size={20}
              color="#00AA66"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.methodType}>{m.bank}</Text>
              <Text style={styles.methodInfo}>{m.info}</Text>
              <Text style={styles.methodExpiry}>
                Card Holder: {m.holderName}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteMethod(m.id)}>
              <Ionicons name="trash-outline" size={20} color="#FF4C4C" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Add New Payment Method */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Add New Payment Method
      </Text>
      <View style={styles.form}>
        <TextInput
          placeholder="Bank Name"
          style={styles.input}
          value={form.bankName}
          onChangeText={(text) => setForm({ ...form, bankName: text })}
        />
        <TextInput
          placeholder="Account Number"
          style={styles.input}
          keyboardType="numeric"
          value={form.accountNumber}
          onChangeText={(text) => setForm({ ...form, accountNumber: text })}
        />
        <TextInput
          placeholder="Account Name"
          style={styles.input}
          value={form.accountName}
          onChangeText={(text) => setForm({ ...form, accountName: text })}
        />
      </View>

      <TouchableOpacity style={styles.confirmBtn}>
        <Text style={styles.confirmText}>Confirm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },
  sectionTitle: { fontWeight: "600", fontSize: 16, marginBottom: 10 },
  methodCard: {
    borderWidth: 1,
    borderColor: "#00AA66",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  methodRow: { flexDirection: "row", alignItems: "center" },
  methodType: { fontWeight: "600", fontSize: 14 },
  methodInfo: { color: "#555", fontSize: 13 },
  methodExpiry: { color: "#999", fontSize: 12 },
  form: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#00AA66",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: "#00AA66",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
  },
  confirmText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
