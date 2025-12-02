import {
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { DeliveryRequestSnackbar } from "@/components";
import { usePushNotification } from "@/hooks/push-notification.hook";
import { useTheme } from "../../context/ThemeContext";

export default function TabLayout() {
  const { colors } = useTheme();
  const { expoPushToken, notification } = usePushNotification();
  const data = JSON.stringify(notification, undefined, 2);

  console.log("notification-data: ", data);
  console.log("expo-push-notification: ", expoPushToken);
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.success,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.surface },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <FontAwesome6
                name="map-location-dot"
                size={22}
                color={focused ? colors.success : colors.textSecondary}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="order"
          options={{
            title: "Order",
            tabBarIcon: ({ focused }) => (
              <FontAwesome5
                name="location-arrow"
                size={22}
                color={focused ? colors.success : colors.textSecondary}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ focused }) => (
              <MaterialIcons
                name="wallet"
                size={24}
                color={focused ? colors.success : colors.textSecondary}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="book-outline"
                size={22}
                color={focused ? colors.success : colors.textSecondary}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <FontAwesome5
                name="user-alt"
                size={22}
                color={focused ? colors.success : colors.textSecondary}
              />
            ),
          }}
        />
      </Tabs>

      {/* Global Delivery Request Snackbar */}
      <DeliveryRequestSnackbar />
    </View>
  );
}
