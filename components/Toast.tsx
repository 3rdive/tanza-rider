import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastContext, ToastType } from "@/context/ToastContext";
import { rs } from "@/lib/functions";

const { width } = Dimensions.get("window");

const getToastColors = (type: ToastType) => {
  switch (type) {
    case "success":
      return {
        iconBg: "#4CAF50",
        icon: "✓",
      };
    case "error":
      return {
        iconBg: "#F44336",
        icon: "✕",
      };
    case "info":
      return {
        iconBg: "#2196F3",
        icon: "i",
      };
    case "warning":
      return {
        iconBg: "#FF9800",
        icon: "!",
      };
  }
};

export const Toast: React.FC = () => {
  const { toast, hideToast } = useToastContext();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (toast) {
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      // Slide out
      Animated.timing(translateY, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [toast, translateY]);

  if (!toast) return null;

  const colors = getToastColors(toast.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={styles.toast}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}
        >
          <Text style={styles.icon}>{colors.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.message}>{toast.message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: width - 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    color: "#FFFFFF",
    fontSize: rs(18),
    fontWeight: "bold",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: rs(15),
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  message: {
    fontSize: rs(13),
    color: "#666666",
  },
});
