import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  pickupLabel?: string;
  pickupText: string;
  dropoffLabel?: string;
  dropoffText: string;
};

export default function LocationSummaryCard({
  pickupLabel = "Pickup",
  pickupText,
  dropoffLabel = "Drop-off",
  dropoffText,
}: Props) {
  return (
    <View style={styles.topCard}>
      <View style={styles.locationRow}>
        <Ionicons name="location" size={18} color="#00AA66" />
        <Text style={styles.locationText}>
          {pickupLabel}: {pickupText}
        </Text>
      </View>
      <View style={styles.locationRow}>
        <Ionicons name="flag" size={18} color="#FF4C4C" />
        <Text style={styles.locationText}>
          {dropoffLabel}: {dropoffText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topCard: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    width: "90%",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  locationText: { marginLeft: 6, fontSize: 13, color: "#333" },
});
