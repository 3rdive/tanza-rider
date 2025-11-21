import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Platform } from "expo-modules-core";
import { userService } from "@/lib/api";
import { StorageMechanics } from "@/lib/storage-mechanics";

export interface PushNotificationState {
  notification?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
}

export const usePushNotification = (): PushNotificationState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldShowAlert: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const registerForPushNotification = async () => {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("We need access to keep you updated on your orders");
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      return token;
    } else {
      console.log("ERROR: Please use a physical device");
    }
  };

  useEffect(() => {
    registerForPushNotification().then(async (token) => {
      setExpoPushToken(token);
      if (!token) return;

      const tokenValue =
        (token as Notifications.ExpoPushToken)?.data ??
        (typeof token === "string" ? token : JSON.stringify(token));

      try {
        // Only update the backend if it's been at least 7 days since last successful registration
        const shouldUpdate =
          await StorageMechanics.shouldUpdatePushRegistration(7);
        if (!shouldUpdate) {
          return;
        }

        await userService.updatePushNotificationToken({
          expoPushNotificationToken: tokenValue,
        });

        // Persist the timestamp of the last successful registration
        await StorageMechanics.setLastPushRegistration(Date.now());
      } catch (err) {
        console.log("Failed to register push token:", err);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};
