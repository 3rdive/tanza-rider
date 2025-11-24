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
  Easing,
  RefreshControl,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  UrlTile,
} from "react-native-maps";
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

export default function HomeScreen() {
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
    outputRange: ["rgba(255,255,255,1)", "rgba(255,255,255,0)"],
  });
  const headerBorderColor = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(240,240,240,1)", "rgba(240,240,240,0)"],
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

  // Poll for pending tasks every 30 seconds
  const { tasks, completeTask, cancelTask } = useTasks({ status: "pending" });

  const [headerHidden, setHeaderHidden] = useState(false);
  const [currentReviewTask, setCurrentReviewTask] = useState<{
    taskId: string;
    user: { name: string; avatar?: string; userId: string };
  } | null>(null);
  const router = useRouter();

  const handleToggleOnline = (value: boolean) => {
    setActive(value);
  };

  const hideHeader = useCallback(() => {
    setHeaderHidden(true);
    // smooth hide with easing
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [headerAnim]);

  const showHeader = useCallback(() => {
    setHeaderHidden(false);
    // smooth show with easing
    Animated.timing(headerAnim, {
      toValue: 0,
      duration: 420,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [headerAnim]);

  // Debounced region-change handler (fires while map is moving)
  const regionChangeTimeout = useRef<number | null>(null);
  const handleRegionChange = () => {
    // user is moving map: hide header immediately
    hideHeader();
    // clear any existing timeout
    if (regionChangeTimeout.current) {
      clearTimeout(regionChangeTimeout.current as unknown as number);
    }
    // show header after short pause in movement
    regionChangeTimeout.current = setTimeout(() => {
      showHeader();
      regionChangeTimeout.current = null;
    }, 700) as unknown as number;
    console.debug("handleRegionChange fired");
  };

  // cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (regionChangeTimeout.current) {
        clearTimeout(regionChangeTimeout.current as unknown as number);
      }
    };
  }, []);

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

  const [showReview, setShowReview] = useState(false);

  // Check for review_request tasks and show modal
  useEffect(() => {
    if (tasks.length > 0) {
      // Find the first review_request task
      const reviewTask = tasks.find(
        (task) => task.category === "request_review",
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
        error?.message || "Failed to submit review. Please try again.",
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
          Haptics.NotificationFeedbackType.Warning,
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
    }, [refetchOrders]),
  );

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
          Haptics.NotificationFeedbackType.Success,
        );

        Alert.alert(
          "Success",
          `Order status updated to ${newStatus.replace("_", " ")}`,
        );
      } catch (error: any) {
        console.error("Error updating order status:", error);
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to update order status",
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
            latitude: parseFloat(currentActiveOrder.pickUpLocation.latitude),
            longitude: parseFloat(currentActiveOrder.pickUpLocation.longitude),
          }
        : { latitude: 37.78825, longitude: -122.4324 },
    [currentActiveOrder],
  );

  const dropoffCoords = React.useMemo(
    () =>
      currentActiveOrder
        ? {
            latitude: parseFloat(currentActiveOrder.dropOffLocation.latitude),
            longitude: parseFloat(currentActiveOrder.dropOffLocation.longitude),
          }
        : { latitude: 37.75825, longitude: -122.4524 },
    [currentActiveOrder],
  );

  // Get all delivery destination coordinates for multi-delivery orders
  const deliveryDestinationCoords = React.useMemo(() => {
    if (
      currentActiveOrder?.hasMultipleDeliveries &&
      currentActiveOrder?.deliveryDestinations
    ) {
      return currentActiveOrder.deliveryDestinations.map((dest) => ({
        latitude: parseFloat(dest.dropOffLocation.latitude),
        longitude: parseFloat(dest.dropOffLocation.longitude),
        address: dest.dropOffLocation.address,
        recipient: dest.recipient.name,
        delivered: dest.delivered,
        id: dest.id,
      }));
    }
    return [];
  }, [currentActiveOrder]);

  // Calculate map region to fit all markers (pickup + all destinations)
  const mapRegion = React.useMemo(() => {
    // If no active order, center on rider location
    if (!currentActiveOrder && latitude !== null && longitude !== null) {
      return {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // For multi-delivery orders, calculate bounds for all destinations
    if (deliveryDestinationCoords.length > 0) {
      const allCoords = [pickupCoords, ...deliveryDestinationCoords];
      const lats = allCoords.map((c) => c.latitude);
      const lons = allCoords.map((c) => c.longitude);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      const latDelta = maxLat - minLat;
      const lonDelta = maxLon - minLon;

      // Add padding (1.5x the delta or minimum 0.02)
      const latitudeDelta = Math.max(latDelta * 1.5, 0.02);
      const longitudeDelta = Math.max(lonDelta * 1.5, 0.02);

      // Center of all points
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;

      return {
        latitude: centerLat,
        longitude: centerLon,
        latitudeDelta,
        longitudeDelta,
      };
    }

    // For single delivery, use pickup and dropoff
    const latDelta = Math.abs(pickupCoords.latitude - dropoffCoords.latitude);
    const lonDelta = Math.abs(pickupCoords.longitude - dropoffCoords.longitude);

    // Add padding (1.5x the delta or minimum 0.02)
    const latitudeDelta = Math.max(latDelta * 1.5, 0.02);
    const longitudeDelta = Math.max(lonDelta * 1.5, 0.02);

    // Center between the two points
    const centerLat = (pickupCoords.latitude + dropoffCoords.latitude) / 2;
    const centerLon = (pickupCoords.longitude + dropoffCoords.longitude) / 2;

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta,
      longitudeDelta,
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
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentActiveOrder, latitude, longitude, pulseAnim]);

  return (
    <View style={styles.container}>
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
        pointerEvents={headerHidden ? "none" : "auto"}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.riderName}>Samuel Rider</Text>
        </View>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.statusText,
              { color: isActive ? "#00AA66" : "#999" },
            ]}
          >
            {isActive ? "Active" : "Inactive"}
          </Text>
          <Switch
            value={isActive}
            onValueChange={handleToggleOnline}
            trackColor={{ false: "#E5E5E5", true: "#C8E6C9" }}
            thumbColor={isActive ? "#00AA66" : "#f4f3f4"}
            ios_backgroundColor="#E5E5E5"
          />
        </View>
      </Animated.View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={mapRegion}
        onPanDrag={hideHeader}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={showHeader}
      >
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={0}
        />

        {/* Show rider location when no active order */}
        {!currentActiveOrder && latitude !== null && longitude !== null && (
          <Marker coordinate={{ latitude, longitude }} title="Your Location">
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#f58686ff",
                  borderWidth: 3,
                  borderColor: "#fff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                }}
              />
            </Animated.View>
          </Marker>
        )}

        {/* Show pickup/dropoff when there's an active order */}
        {currentActiveOrder && (
          <>
            <Marker coordinate={pickupCoords} title="Pickup" pinColor="green" />

            {/* Multiple delivery destinations */}
            {deliveryDestinationCoords.length > 0 ? (
              <>
                {deliveryDestinationCoords.map((dest, index) => (
                  <Marker
                    key={dest.id}
                    coordinate={{
                      latitude: dest.latitude,
                      longitude: dest.longitude,
                    }}
                    title={`Drop-off ${index + 1}`}
                    description={`${dest.recipient} - ${dest.address}`}
                    pinColor={dest.delivered ? "#00AA66" : "red"}
                  />
                ))}
                {/* Draw polylines from pickup to each destination */}
                {deliveryDestinationCoords.map((dest) => (
                  <Polyline
                    key={`line-${dest.id}`}
                    coordinates={[
                      pickupCoords,
                      { latitude: dest.latitude, longitude: dest.longitude },
                    ]}
                    strokeColor={dest.delivered ? "#00AA66" : "#FFA500"}
                    strokeWidth={3}
                    lineDashPattern={[5, 5]}
                  />
                ))}
              </>
            ) : (
              <>
                <Marker
                  coordinate={dropoffCoords}
                  title="Drop-off"
                  pinColor="red"
                />
                <Polyline
                  coordinates={[pickupCoords, dropoffCoords]}
                  strokeColor="#00AA66"
                  strokeWidth={4}
                />
              </>
            )}
          </>
        )}
      </MapView>

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
            statuses={statuses}
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

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header styles
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  riderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
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

  map: { flex: 1 },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
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
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 10,
  },
  // extraneous styles moved into extracted components
});
