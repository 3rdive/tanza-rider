import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { statuses } from "@/lib/constants";


type Props = {
  currentStatus: string;
};


const DeliveryProgress: React.FC<Props> = ({ currentStatus }) => {
  const getColorForStatus = (label: string, index: number) => {
    const currentIndex = statuses.findIndex((s) => s.label === currentStatus);
    return index <= currentIndex ? statuses[index].color : "#ddd";
  };

  const formatStatusLabel = (statusLabel: string): string => {
    return statusLabel
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name="git-branch" size={20} color="#00AA66" />
        <Text style={styles.sectionTitle}>Delivery Progress</Text>
      </View>

      <View style={styles.statusFlow}>
        {statuses.map((s, i) => (
          <View key={s.label} style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getColorForStatus(s.label, i) },
              ]}
            />
            {i < statuses.length - 1 && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: getColorForStatus(s.label, i) },
                ]}
              />
            )}
            <Text
              style={[
                styles.statusLabel,
                { color: getColorForStatus(s.label, i) },
              ]}
            >
              {formatStatusLabel(s.label)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusFlow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    position: "relative",
  },
  statusItem: { alignItems: "center", flex: 1, position: "relative" },
  statusDot: { width: 14, height: 14, borderRadius: 7, zIndex: 2 },
  connector: {
    position: "absolute",
    top: 6,
    right: "-50%",
    width: "100%",
    height: 2,
    zIndex: 1,
  },
  statusLabel: { fontSize: 10, marginTop: 6 },
});

export default DeliveryProgress;
