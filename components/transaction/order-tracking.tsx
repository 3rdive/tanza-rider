import { MaterialIcons } from "@expo/vector-icons"; // if using expo
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export enum TrackingStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  PICKED_UP = "picked_up",
  TRANSIT = "transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

type Props = {
  trackingData: { status: TrackingStatus }[];
};

const STATUSES: TrackingStatus[] = [
  TrackingStatus.PENDING,
  TrackingStatus.ACCEPTED,
  TrackingStatus.PICKED_UP,
  TrackingStatus.TRANSIT,
  TrackingStatus.DELIVERED,
];

const colors = {
  active: "#09bc10",
  inactive: "#BDBDBD",
  cancelled: "#F44336",
};

const ProgressTracker: React.FC<Props> = ({ trackingData }) => {
  const latestStatus = trackingData[trackingData.length - 1]?.status;
  console.log({ latestStatus });
  console.log({ trackingData });

  const isCancelled = latestStatus === TrackingStatus.CANCELLED;
  const currentIndex = isCancelled
    ? -1
    : STATUSES.indexOf(latestStatus as TrackingStatus);

  return (
    <View style={styles.container}>
      {STATUSES.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        // if cancelled, strike through remaining steps
        const stepColor = isCancelled
          ? colors.cancelled
          : isCompleted
          ? colors.active
          : colors.inactive;

        return (
          <View key={status} style={styles.stepContainer}>
            {/* Step Circle */}
            <View
              style={[
                styles.circle,
                { backgroundColor: stepColor },
                isCurrent && !isCancelled && styles.currentCircle,
              ]}
            >
              {isCancelled && index === 0 ? (
                <MaterialIcons name="cancel" size={18} color="#fff" />
              ) : (
                <Text style={styles.circleText}>{index + 1}</Text>
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                { color: stepColor },
                isCancelled && index > currentIndex && styles.cancelledLabel,
              ]}
            >
              {status.replace("_", " ")}
            </Text>

            {/* Connector Line */}
            {index < STATUSES.length - 1 && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor: isCompleted
                      ? colors.active
                      : colors.inactive,
                  },
                  isCancelled && { backgroundColor: colors.cancelled },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
    zIndex: 2,
  },
  currentCircle: {
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  circleText: {
    color: "#fff",
    fontWeight: "bold",
  },
  label: {
    fontSize: 12,
    textAlign: "center",
    textTransform: "capitalize",
    position: "relative",
    zIndex: 2,
  },
  cancelledLabel: {
    textDecorationLine: "line-through",
  },
  line: {
    position: "absolute",
    top: 16,
    right: -40,
    height: 2,
    width: 80,
    zIndex: 1,
  },
});

export default ProgressTracker;
