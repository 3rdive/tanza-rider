import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { locationService } from "@/lib/api";

export const useDeviceLocation = () => {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const resolveAddress = async (lat: number, lon: number) => {
    try {
      // Prefer backend reverse endpoint for consistent naming
      const rev = await locationService.reverse(lat, lon);
      const d = (rev as any)?.data ?? (rev as any);
      const data = d?.data ?? d;
      const name = data?.name || data?.display_name || "Current Location";
      if (typeof name === "string" && name.trim()) {
        setLocationAddress(name);
        return;
      }
    } catch (_e) {
      // fall back below
    }
    try {
      const resp = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (resp && resp[0]) {
        const r = resp[0] as any;
        const title = r.name || r.street || r.district || r.subregion || r.city || r.region || r.country || "Current Location";
        const parts = [r.street, r.city || r.subregion, r.region, r.country].filter(Boolean);
        const subtitle = parts.join(", ");
        setLocationAddress(subtitle || title);
      }
    } catch (_e) {
      // ignore
    }
  };

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
                  const again = await Location.requestForegroundPermissionsAsync();
                  if (again.status === "granted") {
                    await getUserLocation(false);
                  } else {
                    setErrorMsg("Permission to location was not granted");
                  }
                },
              },
              { text: "No", onPress: () => {} },
            ]
          );
        }
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (coords) {
        const { latitude: lat, longitude: lon } = coords;
        setLatitude(lat);
        setLongitude(lon);
        await resolveAddress(lat, lon);
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

  return { getUserLocation, errorMsg, longitude, latitude, locationAddress, loading };
};