import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  acceptDeliveryRequest,
  declineDeliveryRequest,
  showDeliveryRequest,
} from "@/redux/slices/deliveryRequestSlice";

// Demo delivery requests
const demoDeliveryRequests = [
  {
    id: "req_001",
    customerName: "Sarah Johnson",
    pickupLocation: "Victoria Island, Lagos",
    dropoffLocation: "Ikeja, Lagos",
    distance: "12.5 km",
    estimatedEarning: 2500,
    packageType: "Documents",
    urgency: "urgent" as const,
    timeAgo: "2 min ago",
  },
  {
    id: "req_002",
    customerName: "Mike Brown",
    pickupLocation: "Lekki Phase 1",
    dropoffLocation: "Surulere, Lagos",
    distance: "18.2 km",
    estimatedEarning: 3200,
    packageType: "Electronics",
    urgency: "normal" as const,
    timeAgo: "5 min ago",
  },
];

export default function DeliveryRequestSnackbar() {
  const dispatch = useDispatch();
  const { showDeliveryModal, currentRequest, isOnline } = useSelector(
    (state: RootState) => state.deliveryRequest
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Simulate delivery requests when online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        dispatch(showDeliveryRequest(demoDeliveryRequests[0]));
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, dispatch, fadeAnim]);

  const handleAcceptRequest = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dispatch(acceptDeliveryRequest());
    });
  };

  const handleDeclineRequest = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dispatch(declineDeliveryRequest());
    });

    // Show next request after delay if still online
    setTimeout(() => {
      if (isOnline && demoDeliveryRequests[1]) {
        dispatch(showDeliveryRequest(demoDeliveryRequests[1]));
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, 5000);
  };

  if (!showDeliveryModal) {
    return null;
  }

  return (
    <View style={styles.snackbarOverlay}>
      <Animated.View
        style={[
          styles.snackbarContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.snackbarContent}>
          <View style={styles.snackbarHeader}>
            <Text style={styles.snackbarTitle}>New Delivery Request</Text>
            <View
              style={[
                styles.urgencyBadge,
                {
                  backgroundColor:
                    currentRequest?.urgency === "urgent"
                      ? "#fef3c7" // Light orange background for urgent
                      : "#f0f9ff", // Light blue background for normal
                },
              ]}
            >
              <Text
                style={[
                  styles.urgencyText,
                  {
                    color:
                      currentRequest?.urgency === "urgent"
                        ? "#d97706" // Dark orange text for urgent
                        : "#0369a1", // Dark blue text for normal
                  },
                ]}
              >
                {currentRequest?.urgency === "urgent"
                  ? "🔥 HIGH PRIORITY"
                  : "📦 NORMAL"}
              </Text>
            </View>
          </View>

          {currentRequest ? (
            <>
              <View style={styles.snackbarDetails}>
                <Text style={styles.snackbarCustomerName}>
                  {currentRequest.customerName}
                </Text>
                <Text style={styles.snackbarPackageType}>
                  {currentRequest.packageType} • {currentRequest.timeAgo}
                </Text>
              </View>

              <View style={styles.snackbarLocations}>
                <Text style={styles.snackbarLocationText}>
                  📍 {currentRequest.pickupLocation}
                </Text>
                <Text style={styles.snackbarLocationText}>
                  📍 {currentRequest.dropoffLocation}
                </Text>
              </View>

              <View style={styles.snackbarFooter}>
                <Text style={styles.snackbarDistance}>
                  {currentRequest.distance}
                </Text>
                <Text style={styles.snackbarEarning}>
                  ₦{currentRequest.estimatedEarning.toLocaleString()}
                </Text>
              </View>

              <View style={styles.snackbarActions}>
                <TouchableOpacity
                  style={styles.snackbarDeclineButton}
                  onPress={handleDeclineRequest}
                >
                  <Text style={styles.snackbarDeclineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.snackbarAcceptButton}
                  onPress={handleAcceptRequest}
                >
                  <Text style={styles.snackbarAcceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.snackbarLoadingState}>
              <Text style={styles.snackbarLoadingText}>Loading request...</Text>
              <ActivityIndicator size="small" color="#00B624" />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  snackbarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    zIndex: 1000, // Ensure it appears above tab content
  },
  snackbarContainer: {
    backgroundColor: "#fff", // White background for light mode
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  snackbarContent: {
    padding: 24,
    paddingBottom: 40, // Extra bottom padding for safe area
  },
  snackbarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  snackbarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000", // Dark text for light mode
  },
  snackbarDetails: {
    marginBottom: 16,
  },
  snackbarCustomerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000", // Dark text for light mode
    marginBottom: 4,
  },
  snackbarPackageType: {
    fontSize: 14,
    color: "#666", // Medium gray for light mode
  },
  snackbarLocations: {
    marginBottom: 16,
  },
  snackbarLocationText: {
    fontSize: 14,
    color: "#333", // Dark gray for light mode
    marginBottom: 6,
    lineHeight: 20,
  },
  snackbarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  snackbarDistance: {
    fontSize: 18,
    color: "#666", // Medium gray for light mode
  },
  snackbarEarning: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#00B624",
  },
  snackbarActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  snackbarDeclineButton: {
    flex: 1,
    backgroundColor: "#f3f4f6", // Light gray button for light mode
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  snackbarDeclineText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280", // Dark gray text for light mode
  },
  snackbarAcceptButton: {
    flex: 1,
    backgroundColor: "#00B624", // Keep green accent
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  snackbarAcceptText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  snackbarLoadingState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  snackbarLoadingText: {
    fontSize: 16,
    color: "#666", // Dark gray for light mode
    marginBottom: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
