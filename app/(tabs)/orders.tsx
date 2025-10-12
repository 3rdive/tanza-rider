import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState("Upcoming");

  const deliveries = [
    {
      id: 1,
      pickup: "21 King St, San Francisco",
      dropoff: "42 Market St, San Francisco",
      distance: "8.2 km",
      price: "$15.50",
    },
    {
      id: 2,
      pickup: "101 Pine Ave, Oakland",
      dropoff: "23 Bay Rd, Berkeley",
      distance: "12.5 km",
      price: "$22.00",
    },
    {
      id: 3,
      pickup: "13 Lakeview Blvd, SF",
      dropoff: "201 Sunset Rd, Daly City",
      distance: "10.1 km",
      price: "$19.20",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {["Upcoming", "Completed", "Cancelled"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delivery List */}
      <ScrollView style={{ marginTop: 10 }}>
        {deliveries.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="navigate" size={16} color="#00B624" />
              <Text style={styles.locationText} numberOfLines={1}>
                {d.pickup}
              </Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="flag" size={16} color="#FF4C4C" />
              <Text style={styles.locationText} numberOfLines={1}>
                {d.dropoff}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>{d.distance}</Text>
              <Text style={styles.detailValue}>{d.price}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingTop: 90,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#00B624",
    borderRadius: 10,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#E6F5EF",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#00B624",
  },
  tabText: { fontWeight: "500", color: "#00B624" },
  activeTabText: { color: "#fff", fontWeight: "600" },

  /* Cards */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00B624",
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  locationText: { marginLeft: 8, color: "#333", fontSize: 13, flex: 1 },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 8,
    paddingTop: 6,
  },
  detailLabel: { fontSize: 13, color: "#777" },
  detailValue: { fontSize: 14, color: "#00B624", fontWeight: "600" },
});
