import {
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { DeliveryRequestSnackbar } from "@/components";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ tabBarActiveTintColor: "#00B624", headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <FontAwesome6
                name="map-location-dot"
                size={22}
                color={focused ? "#00B624" : "black"}
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
                color={focused ? "#00B624" : "black"}
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
                color={focused ? "#00B624" : "black"}
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
                color={focused ? "#00B624" : "black"}
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
                color={focused ? "#00B624" : "black"}
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
