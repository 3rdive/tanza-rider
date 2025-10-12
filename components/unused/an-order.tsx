"use client";

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get("window");

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords: { latitude: number; longitude: number };
  dropoffCoords: { latitude: number; longitude: number };
  packageInfo: string;
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered";
  estimatedTime: string;
  earning: number;
  distance: string;
  specialInstructions?: string;
}

interface PastDelivery {
  id: string;
  customerName: string;
  location: string;
  earning: number;
  completedAt: string;
  rating: number;
}

const mockActiveOrder: DeliveryOrder = {
  id: "ord_001",
  orderNumber: "TZ2024001",
  customerName: "Sarah Johnson",
  customerPhone: "+234 803 456 7890",
  pickupLocation: "123 Victoria Island, Lagos",
  dropoffLocation: "456 Ikeja GRA, Lagos",
  pickupCoords: { latitude: 6.4281, longitude: 3.4219 },
  dropoffCoords: { latitude: 6.6018, longitude: 3.3515 },
  packageInfo: "Electronics - Laptop (2.5kg)",
  status: "accepted",
  estimatedTime: "25 mins",
  earning: 1500,
  distance: "12.5km",
  specialInstructions: "Handle with care, fragile item",
};

const mockPastDeliveries: PastDelivery[] = [
  {
    id: "past_001",
    customerName: "John Smith",
    location: "Lekki Phase 1",
    earning: 1200,
    completedAt: "2 hours ago",
    rating: 5,
  },
  {
    id: "past_002",
    customerName: "Mary Okafor",
    location: "Surulere",
    earning: 800,
    completedAt: "4 hours ago",
    rating: 4,
  },
  {
    id: "past_003",
    customerName: "David Adebayo",
    location: "Yaba",
    earning: 950,
    completedAt: "6 hours ago",
    rating: 5,
  },
];

export default function RiderDeliveryScreen() {
  const [activeOrder, setActiveOrder] =
    useState<DeliveryOrder>(mockActiveOrder);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(mapAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#3b82f6";
      case "picked_up":
        return "#8b5cf6";
      case "in_transit":
        return "#00B624";
      case "delivered":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "picked_up":
        return "Picked Up";
      case "in_transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      default:
        return "Unknown";
    }
  };

  const updateOrderStatus = (newStatus: DeliveryOrder["status"]) => {
    setActiveOrder((prev) => ({ ...prev, status: newStatus }));

    // Animate status change
    Animated.sequence([
      Animated.timing(statusAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(statusAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (newStatus === "delivered") {
      Alert.alert(
        "Delivery Complete!",
        "Great job! The package has been delivered successfully.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleNavigate = (
    coords: { latitude: number; longitude: number },
    label: string
  ) => {
    const url = `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}&zoom=16#map=16/${coords.latitude}/${coords.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open map application");
    });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return "accepted";
      case "accepted":
        return "picked_up";
      case "picked_up":
        return "in_transit";
      case "in_transit":
        return "delivered";
      default:
        return currentStatus;
    }
  };

  const getNextStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return "Accept Order";
      case "accepted":
        return "Mark as Picked Up";
      case "picked_up":
        return "Start Delivery";
      case "in_transit":
        return "Mark as Delivered";
      default:
        return "Complete";
    }
  };

  const StatusFlow = () => {
    const statuses = [
      "pending",
      "accepted",
      "picked_up",
      "in_transit",
      "delivered",
    ];
    const currentIndex = statuses.indexOf(activeOrder.status);

    return (
      <View style={styles.statusFlow}>
        {statuses.map((status, index) => (
          <View key={status} style={styles.statusStep}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    index <= currentIndex ? getStatusColor(status) : "#e5e7eb",
                },
              ]}
            />
            <Text
              style={[
                styles.statusLabel,
                {
                  color:
                    index <= currentIndex ? getStatusColor(status) : "#9ca3af",
                  fontWeight: index === currentIndex ? "bold" : "normal",
                },
              ]}
            >
              {getStatusText(status)}
            </Text>
            {index < statuses.length - 1 && (
              <View
                style={[
                  styles.statusLine,
                  {
                    backgroundColor:
                      index < currentIndex
                        ? getStatusColor(statuses[index + 1])
                        : "#e5e7eb",
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const generateMapHTML = () => {
    const { pickupCoords, dropoffCoords } = activeOrder;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delivery Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .custom-div-icon {
                background: none;
                border: none;
            }
            .pickup-marker {
                background-color: #00B624;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .dropoff-marker {
                background-color: #ff6b6b;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map
            var map = L.map('map').setView([${
              (pickupCoords.latitude + dropoffCoords.latitude) / 2
            }, ${(pickupCoords.longitude + dropoffCoords.longitude) / 2}], 12);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Create custom icons
            var pickupIcon = L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="pickup-marker"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            var dropoffIcon = L.divIcon({
                className: 'custom-div-icon', 
                html: '<div class="dropoff-marker"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            // Add markers
            var pickupMarker = L.marker([${pickupCoords.latitude}, ${
      pickupCoords.longitude
    }], {icon: pickupIcon})
                .addTo(map)
                .bindPopup('<b>Pickup Location</b><br>${
                  activeOrder.pickupLocation
                }');
                
            var dropoffMarker = L.marker([${dropoffCoords.latitude}, ${
      dropoffCoords.longitude
    }], {icon: dropoffIcon})
                .addTo(map)
                .bindPopup('<b>Drop-off Location</b><br>${
                  activeOrder.dropoffLocation
                }');
            
            // Add routing
            L.Routing.control({
                waypoints: [
                    L.latLng(${pickupCoords.latitude}, ${
      pickupCoords.longitude
    }),
                    L.latLng(${dropoffCoords.latitude}, ${
      dropoffCoords.longitude
    })
                ],
                routeWhileDragging: false,
                addWaypoints: false,
                createMarker: function() { return null; }, // Don't create default markers
                lineOptions: {
                    styles: [
                        {color: '#00B624', weight: 6, opacity: 0.8}
                    ]
                },
                show: false, // Hide the instruction panel
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                })
            }).addTo(map);
            
            // Fit map to show both markers
            var group = new L.featureGroup([pickupMarker, dropoffMarker]);
            map.fitBounds(group.getBounds().pad(0.1));
        </script>
    </body>
    </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Delivery</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpIcon}>?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map View */}
        <Animated.View
          style={[
            styles.mapContainer,
            {
              opacity: mapAnim,
              transform: [
                {
                  scale: mapAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <WebView
            source={{ html: generateMapHTML() }}
            style={styles.webMap}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          <TouchableOpacity
            style={styles.fullMapButton}
            onPress={() => {
              const { pickupCoords, dropoffCoords } = activeOrder;
              const centerLat =
                (pickupCoords.latitude + dropoffCoords.latitude) / 2;
              const centerLng =
                (pickupCoords.longitude + dropoffCoords.longitude) / 2;
              const url = `https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}&zoom=14#map=14/${centerLat}/${centerLng}`;
              Linking.openURL(url);
            }}
          >
            <Text style={styles.fullMapText}>Open Full Map</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Order Details */}
        <Animated.View
          style={[
            styles.orderCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>#{activeOrder.orderNumber}</Text>
            <Animated.View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(activeOrder.status),
                  transform: [{ scale: statusAnim }],
                },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(activeOrder.status)}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              👤 {activeOrder.customerName}
            </Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(activeOrder.customerPhone)}
            >
              <Text style={styles.callIcon}>📞</Text>
              <Text style={styles.callText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>
                  {activeOrder.pickupLocation}
                </Text>
              </View>
            </View>

            <View style={styles.locationConnector}>
              <View style={styles.connectorLine} />
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>🎯</Text>
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Drop-off</Text>
                <Text style={styles.locationAddress}>
                  {activeOrder.dropoffLocation}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.packageInfo}>
            <Text style={styles.packageLabel}>📦 Package Details</Text>
            <Text style={styles.packageDetails}>{activeOrder.packageInfo}</Text>
            {activeOrder.specialInstructions && (
              <Text style={styles.specialInstructions}>
                💬 {activeOrder.specialInstructions}
              </Text>
            )}
          </View>

          <View style={styles.deliveryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeOrder.distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeOrder.estimatedTime}</Text>
              <Text style={styles.statLabel}>Est. Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ₦{activeOrder.earning.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Earning</Text>
            </View>
          </View>
        </Animated.View>

        {/* Status Flow */}
        <Animated.View style={[styles.statusCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>📋 Delivery Progress</Text>
          <StatusFlow />
        </Animated.View>

        {/* Action Button */}
        {activeOrder.status !== "delivered" && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: getStatusColor(activeOrder.status) },
            ]}
            onPress={() =>
              updateOrderStatus(
                getNextStatus(activeOrder.status) as DeliveryOrder["status"]
              )
            }
          >
            <Text style={styles.actionButtonText}>
              {getNextStatusText(activeOrder.status)}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 24,
    color: "#000",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00B624",
    borderRadius: 20,
  },
  helpIcon: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mapContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    height: 250, // Set fixed height for WebView
  },
  webMap: {
    flex: 1,
    height: 250,
  },
  fullMapButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#00B624",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fullMapText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  customerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00B624",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  callText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  locationConnector: {
    marginLeft: 8,
    paddingVertical: 8,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: "#00B624",
  },
  packageInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  packageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  packageDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  specialInstructions: {
    fontSize: 14,
    color: "#f59e0b",
    fontStyle: "italic",
  },
  deliveryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00B624",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  statusFlow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusStep: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 12,
  },
  statusLine: {
    position: "absolute",
    top: 6,
    left: "60%",
    right: "-60%",
    height: 2,
    zIndex: -1,
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  pastDeliveriesCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pastDeliveriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    color: "#00B624",
    fontSize: 14,
    fontWeight: "600",
  },
  pastDeliveryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pastDeliveryInfo: {
    flex: 1,
  },
  pastCustomerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  pastLocation: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  pastTime: {
    fontSize: 11,
    color: "#999",
  },
  pastDeliveryStats: {
    alignItems: "flex-end",
  },
  pastEarning: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00B624",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  ratingStars: {
    fontSize: 12,
  },
});
