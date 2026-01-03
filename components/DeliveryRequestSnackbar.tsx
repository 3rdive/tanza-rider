import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useDeliveryRequest } from "@/hooks/useDeliveryRequest";
import { useAssignedOrders } from "@/hooks/useAssignedOrders";
import { IAssignedOrder } from "@/lib/api";
import { useRiderActiveStatus } from "@/hooks/useRiderActiveStatus";
import { useAudioPlayer } from "expo-audio";
import sound from "@/assets/sounds/notification.wav";
import { useActiveOrders } from "@/hooks/useActiveOrders";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function DeliveryRequestSnackbar() {
  const { colors } = useTheme();
  const player = useAudioPlayer(sound);

  const {
    showDeliveryModal,
    currentRequest,
    showDeliveryRequest,
    acceptDeliveryRequest,
    declineDeliveryRequest,
  } = useDeliveryRequest();
  const { refetch } = useActiveOrders();
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
  const handlingRequestRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDeclineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Convert IAssignedOrder to the format expected by useDeliveryRequest
  const convertToRequestFormat = useCallback(
    (order: IAssignedOrder) => ({
      id: order.id,
      customerName: order.userFullName,
      pickupLocation: order.pickUpLocation.address,
      dropoffLocation: order.dropOffLocation.address,
      distance: order.distanceInKm,
      estimatedEarning: order.amount,
      packageType: "Package", //
      isUrgent: order.isUrgent,
      timeAgo: "Just now",
      hasMultipleDeliveries: order.hasMultipleDeliveries,
      deliveryDestinations: order.deliveryDestinations,
      isCashPayment: order.isCashPayment,
      cashAmountToReceive: order.cashAmountToReceive,
    }),
    []
  );

  // Clear timer when component unmounts or request is handled
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoDeclineTimeoutRef.current) {
      clearTimeout(autoDeclineTimeoutRef.current);
      autoDeclineTimeoutRef.current = null;
    }
  }, []);

  // Trigger notification (vibration and haptic feedback)
  const triggerNotification = useCallback(async () => {
    try {
      player.seekTo(0); // Reset to start if needed
      player.play();
    } catch (error) {
      console.log("Notification error:", error);
    }
  }, [player]);

  // Start 30-second auto-decline timer
  const startTimer = useCallback(() => {
    handlingRequestRef.current = false;
    setTimeLeft(30);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, []);

  const handleDecline = useCallback(async () => {
    if (!currentRequest || handlingRequestRef.current) return;

    handlingRequestRef.current = true;
    clearTimer();

    const result = await declineOrder(currentRequest.id);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      declineDeliveryRequest();
      handlingRequestRef.current = false;
    });

    if (!result.success) {
      console.error("Failed to decline order:", result.message);
    }

    // Show next order if available
    setTimeout(() => {
      if (isActive && assignedOrders.length > 0) {
        const nextOrder = assignedOrders.find(
          (order) => !processedOrdersRef.current.has(order.id)
        );
        if (nextOrder) {
          processedOrdersRef.current.add(nextOrder.id);
          showDeliveryRequest(convertToRequestFormat(nextOrder));
          triggerNotification();
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          startTimer();
        }
      }
    }, 2000);
  }, [
    currentRequest,
    handlingRequestRef,
    clearTimer,
    declineOrder,
    fadeAnim,
    declineDeliveryRequest,
    isActive,
    assignedOrders,
    showDeliveryRequest,
    convertToRequestFormat,
    triggerNotification,
    startTimer,
  ]);

  // Auto-decline when timer reaches 0
  useEffect(() => {
    if (!showDeliveryModal || timeLeft > 0 || handlingRequestRef.current) {
      return;
    }

    if (autoDeclineTimeoutRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      autoDeclineTimeoutRef.current = null;
      handleDecline();
    }, 0);
    autoDeclineTimeoutRef.current = timeoutId;

    return () => {
      if (autoDeclineTimeoutRef.current === timeoutId) {
        clearTimeout(timeoutId);
        autoDeclineTimeoutRef.current = null;
      }
    };
  }, [timeLeft, showDeliveryModal, handleDecline]);

  // Clear timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Show delivery request when new order is received via WebSocket
  useEffect(() => {
    if (
      newOrderReceived &&
      isActive &&
      !processedOrdersRef.current.has(newOrderReceived.id)
    ) {
      processedOrdersRef.current.add(newOrderReceived.id);
      showDeliveryRequest(convertToRequestFormat(newOrderReceived));
      triggerNotification();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      clearNewOrder();
      startTimer();
    }
  }, [
    newOrderReceived,
    isActive,
    fadeAnim,
    showDeliveryRequest,
    clearNewOrder,
    startTimer,
    convertToRequestFormat,
    triggerNotification,
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      startTimer();
    }
  }, [
    isActive,
    assignedOrders,
    showDeliveryModal,
    fadeAnim,
    showDeliveryRequest,
    convertToRequestFormat,
    startTimer,
  ]);

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    handlingRequestRef.current = true;
    clearTimer();
    const result = await acceptOrder(currentRequest.id);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      acceptDeliveryRequest();
      handlingRequestRef.current = false;
    });

    refetch();

    if (!result.success) {
      console.error("Failed to accept order:", result.message);
    }
  };

  if (!showDeliveryModal) {
    return null;
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
      zIndex: 1000,
    },
    snackbarContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    snackbarContent: {
      padding: 24,
      paddingBottom: 40,
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
      color: colors.text,
    },
    snackbarDetails: {
      marginBottom: 16,
    },
    snackbarCustomerName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    snackbarPackageType: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    snackbarLocations: {
      marginBottom: 16,
    },
    snackbarLocationText: {
      fontSize: 14,
      color: colors.text,
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
      color: colors.textSecondary,
    },
    snackbarEarning: {
      fontSize: 25,
      fontWeight: "bold",
      color: colors.success,
    },
    snackbarActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingTop: 10,
    },
    snackbarButtonDisabled: {
      opacity: 0.5,
    },
    snackbarLoadingState: {
      alignItems: "center",
      paddingVertical: 30,
    },
    snackbarLoadingText: {
      fontSize: 16,
      color: colors.textSecondary,
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
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    timerContainer: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 40,
      alignItems: "center",
    },
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF3B30",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      minWidth: 64,
      gap: 6,
    },
    timerText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    iconButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    declineButton: {
      backgroundColor: "#FF3B30",
    },
    acceptButton: {
      backgroundColor: "#34C759",
    },
    acceptCtaButton: {
      backgroundColor: colors.success,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    acceptCtaText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.background,
    },
  });

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
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={handleDecline}
                disabled={!!processingOrderId}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="time" size={14} color="#fff" />
                <Text style={styles.timerText}>{timeLeft}s</Text>
                <Ionicons
                  name="close"
                  size={14}
                  color="#fff"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.urgencyBadge,
                  {
                    backgroundColor: currentRequest?.isUrgent
                      ? "#fef3c7"
                      : "#f0f9ff",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.urgencyText,
                    {
                      color: currentRequest?.isUrgent ? "#d97706" : "#0369a1",
                    },
                  ]}
                >
                  {currentRequest?.isUrgent ? "🔥 HIGH PRIORITY" : "📦 NORMAL"}
                </Text>
              </View>
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
                {currentRequest.hasMultipleDeliveries &&
                currentRequest.deliveryDestinations &&
                currentRequest.deliveryDestinations.length > 0 ? (
                  <>
                    <Text
                      style={[
                        styles.snackbarLocationText,
                        { fontWeight: "600", marginTop: 4 },
                      ]}
                    >
                      {currentRequest.deliveryDestinations.length} Drop-off
                      Locations
                    </Text>
                    {currentRequest.deliveryDestinations.map(
                      (dest: any, idx: number) => (
                        <Text
                          key={dest.id}
                          style={[
                            styles.snackbarLocationText,
                            { fontSize: 11, paddingLeft: 12 },
                          ]}
                        >
                          {idx + 1}. {dest.dropOffLocation.address}
                        </Text>
                      )
                    )}
                  </>
                ) : (
                  <Text style={styles.snackbarLocationText}>
                    📍 {currentRequest.dropoffLocation}
                  </Text>
                )}
              </View>

              <View style={styles.snackbarFooter}>
                <View>
                  <Text style={styles.snackbarDistance}>
                    {currentRequest.distance.toFixed(2)} KM
                    {currentRequest.hasMultipleDeliveries && " (total)"}
                  </Text>
                  {currentRequest.isCashPayment && (
                    <Text
                      style={[
                        styles.snackbarDistance,
                        { color: "#FF9500", marginTop: 4 },
                      ]}
                    >
                      Pay on Delivery
                    </Text>
                  )}
                  {(currentRequest.cashAmountToReceive ?? 0) > 0 && (
                    <Text
                      style={[
                        styles.snackbarDistance,
                        {
                          color: colors.success,
                          marginTop: 2,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      Receive: ₦
                      {(
                        currentRequest.cashAmountToReceive ?? 0
                      ).toLocaleString()}
                    </Text>
                  )}
                </View>
                <Text style={styles.snackbarEarning}>
                  ₦{currentRequest.estimatedEarning?.toLocaleString()}
                </Text>
              </View>

              <View style={styles.snackbarActions}>
                <TouchableOpacity
                  style={[
                    styles.acceptCtaButton,
                    processingOrderId && styles.snackbarButtonDisabled,
                  ]}
                  onPress={handleAcceptRequest}
                  disabled={!!processingOrderId}
                >
                  {processingOrderId === currentRequest?.id ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.acceptCtaText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.snackbarLoadingState}>
              <Text style={styles.snackbarLoadingText}>Loading request...</Text>
              <ActivityIndicator size="small" color={colors.success} />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
