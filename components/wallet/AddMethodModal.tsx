import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WithdrawalMethod {
  id: string;
  name: string;
  type: "bank";
  details: string;
  accountNumber?: string;
}

interface AddMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMethod: (method: Omit<WithdrawalMethod, "id">) => void;
}

const AddMethodModal: React.FC<AddMethodModalProps> = ({
  visible,
  onClose,
  onAddMethod,
}) => {
  const [newMethodName, setNewMethodName] = useState<string>("");
  const [newMethodType, setNewMethodType] = useState<"bank">("bank");
  const [newMethodDetails, setNewMethodDetails] = useState<string>("");
  const [newMethodAccount, setNewMethodAccount] = useState<string>("");

  const addWithdrawalMethod = (): void => {
    if (!newMethodName || !newMethodDetails || !newMethodAccount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const newMethod: Omit<WithdrawalMethod, "id"> = {
      name: newMethodName,
      type: newMethodType,
      details: newMethodDetails,
      accountNumber: newMethodAccount,
    };

    onAddMethod(newMethod);
    resetForm();
    onClose();
    Alert.alert("Success", "Withdrawal method added successfully");
  };

  const resetForm = () => {
    setNewMethodName("");
    setNewMethodType("bank");
    setNewMethodDetails("");
    setNewMethodAccount("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
    >
      <View style={styles.addMethodModalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.addMethodModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Method</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.addMethodModalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.enhancedInput}
                    value={newMethodName}
                    onChangeText={setNewMethodName}
                    placeholder="Enter full name as on account"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.enhancedInput}
                    value={newMethodDetails}
                    onChangeText={setNewMethodDetails}
                    placeholder="e.g. UBA, GTBank, First Bank"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.enhancedInput}
                    value={newMethodAccount}
                    onChangeText={setNewMethodAccount}
                    placeholder="Enter 10-digit account number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Preview Card */}
              {(newMethodName || newMethodDetails || newMethodAccount) && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>Preview</Text>
                  <View style={styles.previewCard}>
                    <View style={styles.previewIcon}>
                      <Ionicons name="card" size={20} color="#00B624" />
                    </View>
                    <View style={styles.previewDetails}>
                      <Text style={styles.previewName}>
                        {newMethodName || "Account Holder Name"}
                      </Text>
                      <Text style={styles.previewSubtext}>
                        {newMethodDetails || "Bank Name"} •{" "}
                        {newMethodAccount || "Account"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.addMethodConfirmButton,
                (!newMethodName || !newMethodDetails || !newMethodAccount) &&
                  styles.addMethodConfirmButtonDisabled,
              ]}
              onPress={addWithdrawalMethod}
              disabled={
                !newMethodName || !newMethodDetails || !newMethodAccount
              }
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addMethodConfirmButtonText}>Add Method</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  addMethodModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  addMethodModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "80%",
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  addMethodModalBody: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  enhancedInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#000",
  },
  previewSection: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  previewDetails: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  previewSubtext: {
    fontSize: 14,
    color: "#64748b",
  },
  addMethodConfirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B624",
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  addMethodConfirmButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  addMethodConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddMethodModal;
