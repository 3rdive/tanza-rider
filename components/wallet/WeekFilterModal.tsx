import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type WeekOption =
  | "this_week"
  | "last_week"
  | "last_2_weeks"
  | "last_4_weeks"
  | "all";

interface WeekFilterModalProps {
  visible: boolean;
  selectedOption: WeekOption;
  onSelectOption: (option: WeekOption) => void;
  onClose: () => void;
}

const WeekFilterModal: React.FC<WeekFilterModalProps> = ({
  visible,
  selectedOption,
  onSelectOption,
  onClose,
}) => {
  const options = [
    { key: "this_week" as WeekOption, label: "This Week" },
    { key: "last_week" as WeekOption, label: "Last Week" },
    { key: "last_2_weeks" as WeekOption, label: "Last 2 Weeks" },
    { key: "last_4_weeks" as WeekOption, label: "Last 4 Weeks" },
    { key: "all" as WeekOption, label: "All" },
  ];

  const handleSelect = (key: WeekOption) => {
    onSelectOption(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.addMethodModalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.weekModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Week</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            {options.map((opt) => {
              const isSelected = selectedOption === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.weekOption,
                    isSelected && styles.weekOptionSelected,
                  ]}
                  onPress={() => handleSelect(opt.key)}
                >
                  <Text
                    style={[
                      styles.weekOptionText,
                      isSelected && { color: "#fff" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  weekModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "50%",
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
  weekOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6eef1",
    marginBottom: 12,
  },
  weekOptionSelected: {
    backgroundColor: "#00B624",
    borderColor: "#00B624",
  },
  weekOptionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
});

export default WeekFilterModal;
