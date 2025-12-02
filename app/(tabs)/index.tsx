import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Clipboard,
  Alert,
  Switch,
  Animated,
  RefreshControl,
  Dimensions,
} from "react-native";
// import { StatusBar } from 'expo-status-bar';
import { LeafletView } from "react-native-leaflet-view";
import * as Haptics from "expo-haptics";
import ReviewBottomSheet from "../../components/review-bottom-sheet";
import DocumentStatusBanner from "../../components/DocumentStatusBanner";
import ActiveDeliveryCard from "../../components/home/ActiveDeliveryCard";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useRider } from "../../hooks/rider.hook";
import { useRiderActiveStatus } from "@/hooks/useRiderActiveStatus";
import { useActiveOrders } from "@/hooks/useActiveOrders";
import {
  orderService,
  OrderTrackingStatus,
  ratingService,
  ITaskReference,
} from "@/lib/api";
import { useDeviceLocation } from "@/hooks/location.hook";
import { useTasks } from "@/hooks/useTasks";
import { useUser } from "@/redux/hooks/hooks";
import { useTheme } from "../../context/ThemeContext";

export default function HomeScreen() {
  const { colors } = useTheme();
  const [status, setStatus] = useState<OrderTrackingStatus>("accepted");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerTranslate = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120], // slide up by ~120px when hidden (cover safe area)
  });
  const headerFade = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  // Fade background and border to transparent so white rectangle disappears
  const headerBgColor = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, "transparent"],
  });
  const headerBorderColor = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, "transparent"],
  });

  const { isActive, setActive } = useRiderActiveStatus();
  const { loading, documentStatus, rejectionReason, fetchRider } = useRider();
  const {
    activeOrders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useActiveOrders();
  const { latitude, longitude } = useDeviceLocation();
  const { user } = useUser();

  // Poll for pending tasks every 30 seconds
  const { tasks, completeTask, cancelTask } = useTasks({ status: "pending" });

  const [currentReviewTask, setCurrentReviewTask] = useState<{
    taskId: string;
    user: { name: string; avatar?: string; userId: string };
  } | null>(null);
  const router = useRouter();

  const handleToggleOnline = (value: boolean) => {
    setActive(value);
  };

  const [showReview, setShowReview] = useState(false);

  // Check for review_request tasks and show modal
  useEffect(() => {
    if (tasks.length > 0) {
      // Find the first review_request task
      const reviewTask = tasks.find(
        (task) => task.category === "request_review"
      );

      if (reviewTask) {
        try {
          // Parse the reference JSON to get user info
          const reference: ITaskReference = JSON.parse(reviewTask.reference);

          setCurrentReviewTask({
            taskId: reviewTask.id,
            user: {
              name: `${reference.firstName} ${reference.lastName}`,
              avatar: reference.profilePic,
              userId: reference.userId,
            },
          });

          // Show review modal
          setShowReview(true);
        } catch (error) {
          console.error("Error parsing task reference:", error);
        }
      }
    }
  }, [tasks]);

  const handleSubmitReview = async (payload: {
    rating: number;
    comments: string[];
  }) => {
    if (!currentReviewTask) {
      console.error("No review task available");
      return;
    }

    try {
      // Submit the rating
      await ratingService.rateUser({
        targetUserId: currentReviewTask.user.userId,
        starRating: payload.rating,
        comment: payload.comments.join(", "),
      });

      // Mark task as complete
      await completeTask(currentReviewTask.taskId);

      // Close modal and reset
      setShowReview(false);
      setCurrentReviewTask(null);

      // Show success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thanks", "Your review has been submitted");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to submit review. Please try again."
      );
    }
  };

  const handleCloseReview = () => {
    setShowReview(false);
  };

  const handleCancelReview = async () => {
    if (!currentReviewTask) {
      setShowReview(false);
      return;
    }
    try {
      await cancelTask(currentReviewTask.taskId);
    } catch (err) {
      console.error("Failed to cancel review task", err);
    } finally {
      setShowReview(false);
      setCurrentReviewTask(null);
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      } catch {}
    }
  };

  // Navigate to document/profile if INITIAL
  useEffect(() => {
    if (documentStatus === "INITIAL") {
      // push to profile/document
      router.push("/profile/document");
    }
  }, [documentStatus, router]);

  // Refetch active orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchOrders();
    }, [refetchOrders])
  );

  const statuses = [
    { label: "pending", color: "#FFA500" },
    { label: "accepted", color: "#007bff" },
    { label: "picked_up", color: "#ff9500" },
    { label: "transit", color: "#2196F3" },
    { label: "delivered", color: "#9c27b0" },
  ];

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
  };

  const nextStatus = async () => {
    if (!currentActiveOrder) {
      Alert.alert("Error", "No active order to update");
      return;
    }

    const currentIndex = statuses.findIndex((s) => s.label === currentStatus);
    if (currentIndex < statuses.length - 1) {
      const newStatus = statuses[currentIndex + 1].label as OrderTrackingStatus;

      try {
        setUpdatingStatus(true);
        // Call API to update order tracking
        await orderService.track({
          orderId: currentActiveOrder.orderId,
          status: newStatus,
        });

        // Update local state
        setStatus(newStatus);

        // Refetch active orders to get updated data
        refetchOrders();

        // Vibrate on success
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        Alert.alert(
          "Success",
          `Order status updated to ${newStatus.replace("_", " ")}`
        );
      } catch (error: any) {
        console.error("Error updating order status:", error);
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to update order status"
        );
      } finally {
        setUpdatingStatus(false);
      }
    }
  };

  // Status type kept local to component usage

  // Get the first active order (if any)
  const currentActiveOrder = activeOrders.length > 0 ? activeOrders[0] : null;

  // Determine current status from active order
  const currentStatus = currentActiveOrder
    ? currentActiveOrder.orderTracking.length > 0
      ? currentActiveOrder.orderTracking[
          currentActiveOrder.orderTracking.length - 1
        ].status
      : "pending"
    : status;

  // Map coordinates from active order
  const pickupCoords = React.useMemo(
    () =>
      currentActiveOrder
        ? {
            lat: parseFloat(currentActiveOrder.pickUpLocation.latitude),
            lng: parseFloat(currentActiveOrder.pickUpLocation.longitude),
          }
        : { lat: 37.78825, lng: -122.4324 },
    [currentActiveOrder]
  );

  const dropoffCoords = React.useMemo(
    () =>
      currentActiveOrder
        ? {
            lat: parseFloat(currentActiveOrder.dropOffLocation.latitude),
            lng: parseFloat(currentActiveOrder.dropOffLocation.longitude),
          }
        : { lat: 37.75825, lng: -122.4524 },
    [currentActiveOrder]
  );

  // Get all delivery destination coordinates for multi-delivery orders
  const deliveryDestinationCoords = React.useMemo(() => {
    if (
      currentActiveOrder?.hasMultipleDeliveries &&
      currentActiveOrder?.deliveryDestinations
    ) {
      return currentActiveOrder.deliveryDestinations.map((dest) => ({
        lat: parseFloat(dest.dropOffLocation.latitude),
        lng: parseFloat(dest.dropOffLocation.longitude),
        address: dest.dropOffLocation.address,
        recipient: dest.recipient.name,
        delivered: dest.delivered,
        id: dest.id,
      }));
    }
    return [];
  }, [currentActiveOrder]);

  const getZoomFromDelta = (longitudeDelta: number) => {
    const screenWidth = Dimensions.get("window").width;
    return Math.log2(360 * (screenWidth / 256 / longitudeDelta)) + 1;
  };

  // Calculate map region to fit all markers (pickup + all destinations)
  const { mapCenter, zoom, markers, shapes } = React.useMemo(() => {
    let center = { lat: 37.78825, lng: -122.4324 };
    let calculatedZoom = 12;
    const calculatedMarkers: {
      position: { lat: number; lng: number };
      icon?: string;
      size?: [number, number];
      title?: string;
      id?: string | number;
    }[] = [];
    const calculatedShapes: {
      shapeType: "polyline" | "polygon";
      color: string;
      positions: { lat: number; lng: number }[];
    }[] = [];

    // If no active order, center on rider location
    if (!currentActiveOrder && latitude !== null && longitude !== null) {
      center = { lat: latitude, lng: longitude };
      calculatedZoom = 15;
      calculatedMarkers.push({
        position: { lat: latitude, lng: longitude },
        icon: "https://place-hold.it/32x32/f58686/ffffff?text=U",
        size: [32, 32],
        title: "Your Location",
      });
    }

    if (currentActiveOrder) {
      calculatedMarkers.push({
        position: pickupCoords,
        icon: "https://place-hold.it/32x32/00ff00/000000?text=P",
        size: [32, 32],
        title: "Pickup",
      });

      if (deliveryDestinationCoords.length > 0) {
        const allCoords = [pickupCoords, ...deliveryDestinationCoords];
        const lats = allCoords.map((c) => c.lat);
        const lngs = allCoords.map((c) => c.lng);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const latDelta = maxLat - minLat;
        const lngDelta = maxLng - minLng;

        center = {
          lat: (minLat + maxLat) / 2,
          lng: (minLng + maxLng) / 2,
        };
        if (lngDelta > 0) {
          calculatedZoom = getZoomFromDelta(lngDelta);
        } else if (latDelta > 0) {
          calculatedZoom = getZoomFromDelta(latDelta);
        } else {
          calculatedZoom = 15;
        }

        deliveryDestinationCoords.forEach((dest, index) => {
          calculatedMarkers.push({
            position: dest,
            icon: dest.delivered
              ? "https://place-hold.it/32x32/0000ff/ffffff?text=D"
              : "https://place-hold.it/32x32/ff0000/000000?text=D",
            size: [32, 32],
            title: `Drop-off ${index + 1}`,
          });
          calculatedShapes.push({
            shapeType: "polyline",
            color: dest.delivered ? "#00AA66" : "#FFA500",
            positions: [pickupCoords, dest],
          });
        });
      } else {
        const latDelta = Math.abs(pickupCoords.lat - dropoffCoords.lat);
        const lngDelta = Math.abs(pickupCoords.lng - dropoffCoords.lng);

        center = {
          lat: (pickupCoords.lat + dropoffCoords.lat) / 2,
          lng: (pickupCoords.lng + dropoffCoords.lng) / 2,
        };
        if (lngDelta > 0) {
          calculatedZoom = getZoomFromDelta(lngDelta);
        } else if (latDelta > 0) {
          calculatedZoom = getZoomFromDelta(latDelta);
        } else {
          calculatedZoom = 15;
        }

        calculatedMarkers.push({
          position: dropoffCoords,
          icon: "https://place-hold.it/32x32/ff0000/000000?text=D",
          size: [32, 32],
          title: "Drop-off",
        });
        calculatedShapes.push({
          shapeType: "polyline",
          color: "#00AA66",
          positions: [pickupCoords, dropoffCoords],
        });
      }
    }

    return {
      mapCenter: center,
      zoom: calculatedZoom,
      markers: calculatedMarkers,
      shapes: calculatedShapes,
    };
  }, [
    currentActiveOrder,
    latitude,
    longitude,
    pickupCoords,
    dropoffCoords,
    deliveryDestinationCoords,
  ]);

  // Pulsing animation for rider marker when no active order
  useEffect(() => {
    if (!currentActiveOrder && latitude !== null && longitude !== null) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentActiveOrder, latitude, longitude, pulseAnim]);

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 15,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 10,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    riderName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      width: "100%",
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      elevation: 10,
      maxHeight: "65%",
    },
    sheetHandle: {
      width: 50,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 10,
    },
  });

  return (
    <View style={styles.container}>
      {/*<StatusBar style="light" animated />*/}
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslate }],
            opacity: headerFade,
            backgroundColor: headerBgColor,
            borderBottomColor: headerBorderColor,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.riderName}>
            {user?.lastName} {user?.firstName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.statusText,
              { color: isActive ? colors.success : colors.textSecondary },
            ]}
          >
            {isActive ? "Active" : "Inactive"}
          </Text>
          <Switch
            value={isActive}
            onValueChange={handleToggleOnline}
            ios_backgroundColor={colors.border}
          />
        </View>
      </Animated.View>

      {/* Map */}
      <LeafletView
        mapCenterPosition={mapCenter as any}
        zoom={zoom as any}
        mapMarkers={markers as any}
        mapShapes={shapes as any}
      />

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={!!loading || ordersLoading}
              onRefresh={() => {
                fetchRider();
                refetchOrders();
              }}
            />
          }
        >
          {/* Document Status Banner */}
          <DocumentStatusBanner
            documentStatus={documentStatus}
            rejectionReason={rejectionReason}
          />

          <ActiveDeliveryCard
            status={currentStatus}
            onNextStatus={nextStatus}
            loading={ordersLoading}
            error={!!ordersError}
            onRetry={refetchOrders}
            onCopy={handleCopy}
            activeOrder={currentActiveOrder}
            updatingStatus={updatingStatus}
            onRefetchOrders={refetchOrders}
          />
        </ScrollView>
      </View>
      <ReviewBottomSheet
        visible={showReview}
        onClose={handleCloseReview}
        onCancel={handleCancelReview}
        user={currentReviewTask?.user || null}
        onSubmit={handleSubmitReview}
      />
    </View>
  );
}
