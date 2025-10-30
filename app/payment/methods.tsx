import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useWithdrawalOptions } from "../../hooks/useWithdrawalOptions";
import { withdrawalService, IBank } from "../../lib/api";

export default function PaymentMethodsScreen() {
  const {
    withdrawalOptions,
    isLoading,
    isRefreshing,
    error,
    addWithdrawalOption,
    setDefaultOption,
    deleteOption,
    refresh,
  } = useWithdrawalOptions();

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    bankHoldersName: "",
    slug: "",
    bankCode: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [bankSearchResults, setBankSearchResults] = useState<IBank[]>([]);
  const [isSearchingBanks, setIsSearchingBanks] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState<IBank | null>(null);
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);

  // Search banks with debounce
  useEffect(() => {
    const searchBanks = async () => {
      // Don't search if query is less than 2 characters
      if (bankSearchQuery.trim().length < 2) {
        setBankSearchResults([]);
        setShowBankDropdown(false);
        return;
      }

      // Don't show dropdown if the query matches the selected bank exactly
      if (selectedBank && bankSearchQuery === selectedBank.name) {
        setBankSearchResults([]);
        setShowBankDropdown(false);
        return;
      }

      setIsSearchingBanks(true);
      try {
        const response = await withdrawalService.searchBanks(bankSearchQuery);
        if (response.success && response.data) {
          setBankSearchResults(response.data);
          setShowBankDropdown(true);
        }
      } catch {
        // Silent fail - just clear results
        setBankSearchResults([]);
      } finally {
        setIsSearchingBanks(false);
      }
    };

    const timeoutId = setTimeout(searchBanks, 300);
    return () => clearTimeout(timeoutId);
  }, [bankSearchQuery, selectedBank]);

  // Validate account number when both bank and account number are available
  const validateAccountNumber = useCallback(async () => {
    if (
      !selectedBank ||
      !form.accountNumber ||
      form.accountNumber.length < 10
    ) {
      return;
    }

    setIsValidatingAccount(true);
    setAccountValidated(false);
    try {
      const response = await withdrawalService.validateAccount(
        form.accountNumber,
        selectedBank.code
      );

      if (response.success && response.data) {
        setForm((prev) => ({
          ...prev,
          bankHoldersName: response.data.account_name,
        }));
        setAccountValidated(true);
      }
    } catch {
      Alert.alert(
        "Validation Failed",
        "Could not validate account number. Please check and try again."
      );
      setForm((prev) => ({
        ...prev,
        bankHoldersName: "",
      }));
    } finally {
      setIsValidatingAccount(false);
    }
  }, [selectedBank, form.accountNumber]);

  // Trigger validation when account number reaches 10 digits
  useEffect(() => {
    if (form.accountNumber.length === 10 && selectedBank) {
      validateAccountNumber();
    } else {
      setAccountValidated(false);
      if (form.accountNumber.length !== 10) {
        setForm((prev) => ({
          ...prev,
          bankHoldersName: "",
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.accountNumber, selectedBank]);

  const handleBankSelect = (bank: IBank) => {
    // Update all states
    setSelectedBank(bank);
    setBankSearchQuery(bank.name);
    setBankSearchResults([]); // Clear results immediately
    setShowBankDropdown(false);
    setForm((prev) => ({
      ...prev,
      bankName: bank.name,
      slug: bank.slug,
      bankCode: bank.code,
      bankHoldersName: "", // Reset account name when bank changes
      accountNumber: prev.accountNumber, // Keep existing account number
    }));
    setAccountValidated(false);
    Keyboard.dismiss();
  };

  const isFormValid =
    selectedBank !== null &&
    form.accountNumber.trim().length === 10 &&
    form.bankHoldersName.trim() !== "" &&
    accountValidated;

  const handleDeleteMethod = (id: string, bankName: string) => {
    Alert.alert(
      "Delete Payment Method",
      `Are you sure you want to delete ${bankName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOption(id);
              Alert.alert("Success", "Payment method deleted successfully");
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error
                  ? err.message
                  : "Failed to delete payment method"
              );
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultOption(id);
      Alert.alert("Success", "Default payment method updated");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error
          ? err.message
          : "Failed to set default payment method"
      );
    }
  };

  const handleConfirm = async () => {
    if (!isFormValid) {
      Alert.alert(
        "Validation Error",
        "Please select a bank and validate your account number"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addWithdrawalOption({
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        bankHoldersName: form.bankHoldersName.trim(),
        slug: form.slug.trim(),
      });

      // Clear form
      setForm({
        bankName: "",
        accountNumber: "",
        bankHoldersName: "",
        slug: "",
        bankCode: "",
      });
      setBankSearchQuery("");
      setSelectedBank(null);

      Alert.alert("Success", "Payment method added successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add payment method";

      // Check for duplicate error
      if (errorMessage.toLowerCase().includes("already exists")) {
        Alert.alert(
          "Duplicate Entry",
          "This withdrawal option already exists in your account."
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading && withdrawalOptions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00AA66" />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      );
    }

    if (error && withdrawalOptions.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF4C4C" />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {/* Existing Methods */}
        {withdrawalOptions.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your Payment Methods</Text>
            {withdrawalOptions.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodRow}>
                  <Ionicons name="card-outline" size={24} color="#00AA66" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.methodHeader}>
                      <Text style={styles.methodType}>{method.bankName}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.methodInfo}>
                      {method.accountNumber}
                    </Text>
                    <Text style={styles.methodExpiry}>
                      {method.bankHoldersName}
                    </Text>
                  </View>
                  <View style={styles.methodActions}>
                    {!method.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(method.id)}
                        style={styles.iconButton}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color="#00AA66"
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteMethod(method.id, method.bankName)
                      }
                      style={styles.iconButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF4C4C"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
            <Text style={styles.emptyStateText}>
              Add your first payment method below
            </Text>
          </View>
        )}

        {/* Add New Payment Method */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Add New Payment Method
        </Text>
        <View style={styles.form}>
          {/* Bank Search Autocomplete */}
          <View style={styles.autocompleteContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Search Bank *"
                style={styles.inputWithIcon}
                value={bankSearchQuery}
                onChangeText={(text) => {
                  setBankSearchQuery(text);
                  setShowBankDropdown(true);
                  if (selectedBank && text !== selectedBank.name) {
                    setSelectedBank(null);
                    setAccountValidated(false);
                    setForm({
                      ...form,
                      bankName: "",
                      slug: "",
                      bankCode: "",
                      bankHoldersName: "",
                    });
                  }
                }}
                editable={!isSubmitting}
                autoCapitalize="none"
              />
              {selectedBank && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#00AA66"
                  style={styles.inputIconRight}
                />
              )}
              {isSearchingBanks && (
                <ActivityIndicator
                  size="small"
                  color="#00AA66"
                  style={styles.inputIconRight}
                />
              )}
            </View>

            {/* Bank Dropdown */}
            {showBankDropdown && bankSearchResults.length > 0 && (
              <View style={styles.dropdown}>
                <ScrollView
                  style={styles.dropdownScroll}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {bankSearchResults.map((bank) => (
                    <TouchableOpacity
                      key={bank.id}
                      style={styles.dropdownItem}
                      onPress={() => handleBankSelect(bank)}
                    >
                      <Text style={styles.dropdownItemText}>{bank.name}</Text>
                      <Text style={styles.dropdownItemSubtext}>
                        Code: {bank.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Account Number */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Account Number *"
              style={styles.inputWithIcon}
              keyboardType="numeric"
              value={form.accountNumber}
              onChangeText={(text) => {
                if (text.length <= 10) {
                  setForm({ ...form, accountNumber: text });
                }
              }}
              editable={
                !isSubmitting && !isValidatingAccount && selectedBank !== null
              }
              maxLength={10}
            />
            {isValidatingAccount && (
              <ActivityIndicator
                size="small"
                color="#00AA66"
                style={styles.inputIconRight}
              />
            )}
            {accountValidated && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#00AA66"
                style={styles.inputIconRight}
              />
            )}
          </View>

          {/* Account Holder Name (Auto-populated) */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Account Holder Name *"
              style={[styles.inputWithIcon, styles.inputDisabled]}
              value={form.bankHoldersName}
              editable={false}
            />
            {form.bankHoldersName && (
              <Ionicons
                name="lock-closed"
                size={16}
                color="#999"
                style={styles.inputIconRight}
              />
            )}
          </View>

          {!selectedBank && (
            <Text style={styles.helperText}>
              💡 Please select a bank from the search results
            </Text>
          )}
          {selectedBank && form.accountNumber.length < 10 && (
            <Text style={styles.helperText}>
              💡 Enter your 10-digit account number
            </Text>
          )}
          {selectedBank &&
            form.accountNumber.length === 10 &&
            !accountValidated &&
            !isValidatingAccount && (
              <Text style={styles.helperTextError}>
                ⚠️ Account validation failed. Please check your account number.
              </Text>
            )}
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!isFormValid || isSubmitting) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Add Payment Method</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          colors={["#00AA66"]}
          tintColor="#00AA66"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router?.back()}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 22 }} />
      </View>

      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },
  sectionTitle: { fontWeight: "600", fontSize: 16, marginBottom: 12 },
  methodCard: {
    borderWidth: 1,
    borderColor: "#00AA66",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f9fffe",
  },
  methodRow: { flexDirection: "row", alignItems: "center" },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  methodType: { fontWeight: "600", fontSize: 15, color: "#222" },
  methodInfo: { color: "#555", fontSize: 14, marginBottom: 4 },
  methodExpiry: { color: "#999", fontSize: 13 },
  methodActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  defaultBadge: {
    backgroundColor: "#00AA66",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  form: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#00AA66",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  inputWithIcon: {
    borderWidth: 1,
    borderColor: "#00AA66",
    borderRadius: 10,
    padding: 12,
    paddingRight: 44, // Make room for icon
    fontSize: 15,
  },
  confirmBtn: {
    backgroundColor: "#00AA66",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
  },
  confirmBtnDisabled: {
    backgroundColor: "#ccc",
  },
  confirmText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 32,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00AA66",
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 1000,
    marginBottom: 12,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  inputIconRight: {
    position: "absolute",
    right: 16,
    top: 12,
  },
  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#00AA66",
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 2000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: "#666",
  },
  inputDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  helperText: {
    fontSize: 13,
    color: "#666",
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  helperTextError: {
    fontSize: 13,
    color: "#FF4C4C",
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
});
