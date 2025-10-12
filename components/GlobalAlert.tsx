import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { hideAlert } from "@/redux/slices/alertSlice";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Theme configuration for each alert type
const alertThemes = {
  success: {
    iconName: "check-circle" as const,
    iconColor: "#10B981",
    iconBgColor: "#D1FAE5",
    primaryButtonBg: "#10B981",
    primaryButtonText: "#FFFFFF",
  },
  error: {
    iconName: "cancel" as const,
    iconColor: "#EF4444",
    iconBgColor: "#FEE2E2",
    primaryButtonBg: "#EF4444",
    primaryButtonText: "#FFFFFF",
  },
  warning: {
    iconName: "warning" as const,
    iconColor: "#F59E0B",
    iconBgColor: "#FEF3C7",
    primaryButtonBg: "#F59E0B",
    primaryButtonText: "#FFFFFF",
  },
};

export default function GlobalAlert() {
  const dispatch = useDispatch();
  const alert = useSelector((s: RootState) => s.alert);

  useEffect(() => {
    if (alert.visible && alert.duration && alert.duration > 0) {
      const t = setTimeout(() => dispatch(hideAlert()), alert.duration);
      return () => clearTimeout(t);
    }
  }, [alert.visible, alert.duration, dispatch]);

  if (!alert.visible) return null;

  const theme = alertThemes[alert.type || "success"];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={alert.visible}
      onRequestClose={() => dispatch(hideAlert())}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => dispatch(hideAlert())}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          {/* Icon with themed background */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.iconBgColor },
            ]}
          >
            <MaterialIcons
              name={theme.iconName}
              size={64}
              color={theme.iconColor}
            />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>{alert.heading || "Notification"}</Text>

          {/* Message */}
          {alert.message && <Text style={styles.message}>{alert.message}</Text>}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.primaryButtonBg },
            ]}
            onPress={() => dispatch(hideAlert())}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.primaryBtnText,
                { color: theme.primaryButtonText },
              ]}
            >
              {alert.type === "error" ? "Try Again" : "Okay"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: Math.min(width * 0.9, 400),
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
