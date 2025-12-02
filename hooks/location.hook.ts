import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export const useDeviceLocation = () => {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getUserLocation = async (showMessage: boolean = false) => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to location was not granted");
        if (showMessage) {
          Alert.alert(
            "Location Permission",
            "Please enable location permission in your device settings",
            [
              {
                text: "Access Location",
                onPress: async () => {
                  const again =
                    await Location.requestForegroundPermissionsAsync();
                  if (again.status === "granted") {
                    await getUserLocation(false);
                  } else {
                    setErrorMsg("Permission to location was not granted");
                  }
                },
              },
              { text: "No", onPress: () => {} },
            ],
          );
        }
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (coords) {
        const { latitude: lat, longitude: lon } = coords;
        setLatitude(lat);
        setLongitude(lon);
      }
    } catch (e: any) {
      const msg = e?.message || "Unable to fetch current location";
      setErrorMsg(msg);
      if (showMessage) Alert.alert("Location Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch once on mount (silent, no alerts)
  useEffect(() => {
    getUserLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { getUserLocation, errorMsg, longitude, latitude, loading };
};
