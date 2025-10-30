import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useDeliveryRequest } from "@/hooks/useDeliveryRequest";
import { useAssignedOrders } from "@/hooks/useAssignedOrders";
import { IAssignedOrder } from "@/lib/api";
import { useRiderActiveStatus } from "@/hooks/useRiderActiveStatus";

export default function DeliveryRequestSnackbar() {
  const {
    showDeliveryModal,
    currentRequest,
    showDeliveryRequest,
    acceptDeliveryRequest,
    declineDeliveryRequest,
  } = useDeliveryRequest();
  const { isActive } = useRiderActiveStatus();
  const {
    assignedOrders,
    newOrderReceived,
    clearNewOrder,
    acceptOrder,
    declineOrder,
    processingOrderId,
  } = useAssignedOrders();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const processedOrdersRef = useRef(new Set<string>());

  // Convert IAssignedOrder to the format expected by useDeliveryRequest
  const convertToRequestFormat = (order: IAssignedOrder) => ({
    id: order.id,
    customerName: order.userFullName,
    pickupLocation: order.pickUpLocation.address,
    dropoffLocation: order.dropOffLocation.address,
    distance: order.eta, // Using ETA as distance for now
    estimatedEarning: order.amount,
    packageType: "Package", // Not provided in API, using default
    urgency: "normal" as const, // Not provided in API, using default
    timeAgo: "Just now",
  });

  // Show delivery request when new order is received via WebSocket
  useEffect(() => {
    if (
      newOrderReceived &&
      isActive &&
      !processedOrdersRef.current.has(newOrderReceived.id)
    ) {
      processedOrdersRef.current.add(newOrderReceived.id);
      showDeliveryRequest(convertToRequestFormat(newOrderReceived));
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      clearNewOrder();
    }
  }, [
    newOrderReceived,
    isActive,
    fadeAnim,
    showDeliveryRequest,
    clearNewOrder,
  ]);

  // Show first assigned order on mount if online
  useEffect(() => {
    if (
      isActive &&
      assignedOrders.length > 0 &&
      !showDeliveryModal &&
      !processedOrdersRef.current.has(assignedOrders[0].id)
    ) {
      const firstOrder = assignedOrders[0];
      processedOrdersRef.current.add(firstOrder.id);
      showDeliveryRequest(convertToRequestFormat(firstOrder));
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [
    isActive,
    assignedOrders,
    showDeliveryModal,
    fadeAnim,
    showDeliveryRequest,
  ]);

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    // Call API to accept order
    const result = await acceptOrder(currentRequest.id);

    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      acceptDeliveryRequest();
    });

    // Show feedback to user
    if (!result.success) {
      // You can show an alert here if needed
      console.error("Failed to accept order:", result.message);
    }
  };

  const handleDeclineRequest = async () => {
    if (!currentRequest) return;

    // Call API to decline order
    const result = await declineOrder(currentRequest.id);

    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      declineDeliveryRequest();
    });

    // Show feedback to user
    if (!result.success) {
      console.error("Failed to decline order:", result.message);
    }

    // Show next assigned order after delay if still online
    setTimeout(() => {
      if (isActive && assignedOrders.length > 0) {
        // Find next unprocessed order
        const nextOrder = assignedOrders.find(
          (order) => !processedOrdersRef.current.has(order.id)
        );
        if (nextOrder) {
          processedOrdersRef.current.add(nextOrder.id);
          showDeliveryRequest(convertToRequestFormat(nextOrder));
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    }, 2000);
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
                  ₦{currentRequest.estimatedEarning?.toLocaleString()}
                </Text>
              </View>

              <View style={styles.snackbarActions}>
                <TouchableOpacity
                  style={[
                    styles.snackbarDeclineButton,
                    processingOrderId && styles.snackbarButtonDisabled,
                  ]}
                  onPress={handleDeclineRequest}
                  disabled={!!processingOrderId}
                >
                  {processingOrderId === currentRequest?.id ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Text style={styles.snackbarDeclineText}>Decline</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.snackbarAcceptButton,
                    processingOrderId && styles.snackbarButtonDisabled,
                  ]}
                  onPress={handleAcceptRequest}
                  disabled={!!processingOrderId}
                >
                  {processingOrderId === currentRequest?.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.snackbarAcceptText}>Accept</Text>
                  )}
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
  snackbarButtonDisabled: {
    opacity: 0.5,
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
