import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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
import { Ionicons } from "@expo/vector-icons";
import ReviewBottomSheet from "../../components/review-bottom-sheet";
import DocumentStatusBanner from "../../components/DocumentStatusBanner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { setOnlineStatus } from "../../redux/slices/deliveryRequestSlice";
import { useRouter } from "expo-router";
import { useRider } from "../../hooks/rider.hook";

export default function HomeScreen() {
  const [status, setStatus] = useState("Accepted");
  // const [isActive, setIsActive] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Animation values - initialize with expanded state (1)
  const animatedHeight = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;
  const animatedRotation = useRef(new Animated.Value(1)).current; // 1 = expanded (rotated)
  // Header animation: 0 = visible, 1 = hidden
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

  const dispatch = useDispatch();
  const { isOnline } = useSelector((state: RootState) => state.deliveryRequest);
  const { loading, error, documentStatus, rejectionReason, fetchRider } =
    useRider();
  const [headerHidden, setHeaderHidden] = useState(false);
  const router = useRouter();

  const handleToggleOnline = (value: boolean) => {
    dispatch(setOnlineStatus(value));
  };

  const toggleExpanded = () => {
    // Update state first
    setIsExpanded(!isExpanded);

    // Calculate target values based on NEW state (after toggle)
    const newExpandedState = !isExpanded;
    const targetHeight = newExpandedState ? 1 : 0;
    const targetOpacity = newExpandedState ? 1 : 0;
    const targetRotation = newExpandedState ? 1 : 0;

    // Parallel animations for smooth transition
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: targetHeight,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: targetOpacity,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation, {
        toValue: targetRotation,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideHeader = () => {
    setHeaderHidden(true);
    // smooth hide with easing
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const showHeader = () => {
    setHeaderHidden(false);
    // smooth show with easing
    Animated.timing(headerAnim, {
      toValue: 0,
      duration: 420,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

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
    { label: "Pending", color: "orange" },
    { label: "Accepted", color: "#007bff" },
    { label: "Picked Up", color: "#ff9500" },
    { label: "In-Transit", color: "#00aa66" },
    { label: "Delivered", color: "#9c27b0" },
  ];

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    // Instead of simple alert, open review modal (temporary trigger)
    setShowReview(true);
  };

  const [showReview, setShowReview] = useState(false);

  const handleSubmitReview = (payload: {
    rating: number;
    comments: string[];
  }) => {
    // For now just close and log — in production call API
    console.log("submitted review", payload);
    setShowReview(false);
    Alert.alert("Thanks", "Your review has been submitted");
  };

  // Fetch rider on mount
  useEffect(() => {
    fetchRider();
  }, [fetchRider]);

  // Navigate to document/profile if INITIAL
  useEffect(() => {
    if (documentStatus === "INITIAL") {
      // push to profile/document
      router.push("/profile/document");
    }
  }, [documentStatus, router]);

  const nextStatus = () => {
    const currentIndex = statuses.findIndex((s) => s.label === status);
    if (currentIndex < statuses.length - 1) {
      setStatus(statuses[currentIndex + 1].label);
    }
  };

  interface Status {
    label: string;
    color: string;
  }

  const getColorForStatus = (s: string, index: number): string => {
    const currentIndex = statuses.findIndex(
      (st: Status) => st.label === status
    );
    return index <= currentIndex ? statuses[index].color : "#ddd";
  };

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
              { color: isOnline ? "#00AA66" : "#999" },
            ]}
          >
            {isOnline ? "Active" : "Inactive"}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: "#E5E5E5", true: "#C8E6C9" }}
            thumbColor={isOnline ? "#00AA66" : "#f4f3f4"}
            ios_backgroundColor="#E5E5E5"
          />
        </View>
      </Animated.View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.04,
          longitudeDelta: 0.05,
        }}
        onPanDrag={hideHeader}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={showHeader}
      >
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={0}
        />
        <Marker
          coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
          title="Pickup"
          pinColor="green"
        />
        <Marker
          coordinate={{ latitude: 37.75825, longitude: -122.4524 }}
          title="Drop-off"
          pinColor="red"
        />
        <Polyline
          coordinates={[
            { latitude: 37.78825, longitude: -122.4324 },
            { latitude: 37.75825, longitude: -122.4524 },
          ]}
          strokeColor="#00AA66"
          strokeWidth={4}
        />
      </MapView>

      {/* Pickup & Dropoff Card */}
      <View style={styles.topCard}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color="#00AA66" />
          <Text style={styles.locationText}>
            Pickup: 21 King St, San Francisco
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="flag" size={18} color="#FF4C4C" />
          <Text style={styles.locationText}>
            Drop-off: 42 Market St, San Francisco
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={!!loading}
              onRefresh={() => fetchRider()}
            />
          }
        >
          {/* Document Status Banner */}
          <DocumentStatusBanner
            documentStatus={documentStatus}
            rejectionReason={rejectionReason}
          />

          <View style={styles.deliveryCard}>
            {/* Collapsible Header */}
            <TouchableOpacity
              style={styles.deliveryHeader}
              onPress={toggleExpanded}
              activeOpacity={0.7}
            >
              <Text style={styles.heading}>Active Delivery</Text>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: animatedRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="chevron-down" size={24} color="#666" />
              </Animated.View>
            </TouchableOpacity>

            {/* Collapsible Content */}
            <Animated.View
              style={[
                styles.deliveryContent,
                {
                  maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1000], // Adjust based on your content height
                  }),
                  opacity: animatedOpacity,
                  overflow: "hidden",
                },
              ]}
            >
              {/* Show skeleton or error at top of content */}
              {loading && (
                <View style={{ paddingVertical: 12 }}>
                  <View
                    style={{
                      height: 12,
                      backgroundColor: "#eaeaea",
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  />
                  <View
                    style={{
                      height: 12,
                      backgroundColor: "#eaeaea",
                      borderRadius: 6,
                      marginBottom: 8,
                      width: "70%",
                    }}
                  />
                </View>
              )}
              {error && (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ color: "#d9534f", marginBottom: 8 }}>
                    Failed to load rider info.
                  </Text>
                  <TouchableOpacity
                    style={styles.pastBtn}
                    onPress={() => fetchRider()}
                  >
                    <Text style={styles.pastBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Customer Info */}
              <View style={styles.row}>
                <Image
                  source={{
                    uri: "https://avatar.iran.liara.run/public/34",
                  }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>John Doe</Text>
                  <View style={styles.phoneRow}>
                    <Text style={styles.contact}>+1 (555) 123-4567</Text>
                    <TouchableOpacity
                      onPress={() => handleCopy("+1 (555) 123-4567")}
                    >
                      <Ionicons name="copy-outline" size={18} color="#00AA66" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.packageInfo}>
                    Medium Package • Fragile
                  </Text>
                </View>
              </View>

              {/* Delivery Stats */}
              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Distance</Text>
                  <Text style={styles.infoValue}>8.4 km</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Earnings</Text>
                  <Text style={styles.infoValue}>$16.20</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Est. Time</Text>
                  <Text style={styles.infoValue}>15 mins</Text>
                </View>
              </View>

              {/* Status Flow with Connecting Lines */}
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
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Next Step */}
              {status !== "Delivered" && (
                <TouchableOpacity style={styles.actionBtn} onPress={nextStatus}>
                  <Text style={styles.actionText}>
                    {status === "Accepted"
                      ? "Mark as Picked Up"
                      : status === "Picked Up"
                      ? "Mark as In-Transit"
                      : status === "In-Transit"
                      ? "Mark as Delivered"
                      : "Next"}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </View>
      <ReviewBottomSheet
        visible={showReview}
        onClose={() => setShowReview(false)}
        user={{
          name: "John Doe",
          avatar: "https://avatar.iran.liara.run/public/34",
        }}
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
  heading: { fontSize: 18, fontWeight: "600", marginBottom: 0 },
  deliveryCard: {
    backgroundColor: "#f3f7f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  deliveryContent: {
    paddingTop: 10,
  },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  name: { fontWeight: "700", fontSize: 16 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  contact: { color: "#007b55" },
  packageInfo: { color: "#555", marginTop: 4 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  infoBox: { alignItems: "center", flex: 1 },
  infoLabel: { fontSize: 12, color: "#777" },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#222", marginTop: 2 },

  /* Status Flow */
  statusFlow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    position: "relative",
  },
  statusItem: { alignItems: "center", flex: 1, position: "relative" },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
  },
  connector: {
    position: "absolute",
    top: 6,
    right: "-50%",
    width: "100%",
    height: 2,
    zIndex: 1,
  },
  statusLabel: { fontSize: 10, marginTop: 6 },
  actionBtn: {
    backgroundColor: "#00AA66",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  pastBtn: {
    backgroundColor: "#e9f5f0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  pastBtnText: { color: "#00AA66", fontWeight: "600" },
});
