// typescript
import { useEffect, useState, useCallback, useRef } from "react";
import { riderService, RiderActiveStatus } from "@/lib/api";
import { useDeviceLocation } from "@/hooks/location.hook";
import { useUser } from "../redux/hooks/hooks";

import { createSocket } from "@/lib/socket";

type ReturnType = {
  status: RiderActiveStatus | null;
  isActive: boolean;
  loading: boolean;
  lastUpdate?: string | null;
  setActive: (active: boolean) => Promise<void>;
};

export function useRiderActiveStatus(): ReturnType {
  const { latitude, longitude, getUserLocation } = useDeviceLocation();
  const { user, access_token } = useUser();
  const [status, setStatus] = useState<RiderActiveStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [clientSocket, setClientSocket] = useState<any>(null);

  // refs for movement emission throttling/dedup
  const lastSentCoordsRef = useRef<{
    lat?: string | null;
    lon?: string | null;
  }>({});
  // Keep track of latest coords in ref to access in interval without re-binding
  const latestCoordsRef = useRef<{ lat?: string | null; lon?: string | null }>({
    lat: null,
    lon: null,
  });

  // Update refs when location changes
  useEffect(() => {
    if (latitude != null && longitude != null) {
      latestCoordsRef.current = {
        lat: String(latitude),
        lon: String(longitude),
      };
    }
  }, [latitude, longitude]);

  useEffect(() => {
    // Fetch current active status via HTTP on mount
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await riderService.getActiveStatus();
        const d = (resp as any)?.data?.data ?? (resp as any)?.data;
        if (!mounted) return;
        setStatus(d?.status ?? null);
        setLastUpdate(d?.updatedAt ?? null);
      } catch {
        // Silent fail; callers may render default inactive
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Guard: don't open a socket until we have an authenticated user
    if (!user?.id || !access_token) return;

    const socket = createSocket({ token: access_token });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setClientSocket(socket);
    });

    const channel = `rider.${user.id}.status` as const;
    const updateStatus = (activeStatus: {
      id: string;
      status: "active" | "inactive";
    }) => {
      console.log("Received active status update: ", activeStatus);
      if (activeStatus?.id && activeStatus.id !== String(user.id)) return;
      setStatus(activeStatus?.status);
      setLastUpdate(new Date().toISOString());
    };

    // Attach listeners
    socket.on(channel, updateStatus);
    socket.on("connect_error", (err) => {
      if (__DEV__) console.warn("Socket connect_error:", err?.message ?? err);
    });
    socket.on("disconnect", (reason) => {
      if (__DEV__) console.log("Socket disconnected:", reason);
    });

    // Cleanup on dependency change/unmount: remove listeners and close this socket instance
    return () => {
      try {
        socket.off(channel, updateStatus);
        socket.off("connect_error");
        socket.off("disconnect");
        socket.disconnect();
      } catch {}
    };
  }, [user?.id, access_token]);

  // Combined location update logic: Polls for location and sends if changed
  useEffect(() => {
    const INTERVAL_MS = 5000; // Check every 5 seconds

    if (status !== "active" || !clientSocket || !user?.id) return;

    const checkAndSendLocation = async () => {
      try {
        // 1. Force a fresh location fetch
        await getUserLocation(false);

        // 2. Get latest coords (either from state update or ref if we had one,
        // but here we rely on the ref updated by the other effect)
        const currentLat = latestCoordsRef.current.lat;
        const currentLon = latestCoordsRef.current.lon;

        if (!currentLat || !currentLon) return;

        // 3. Dedupe: Check if different from last sent
        if (
          lastSentCoordsRef.current.lat === currentLat &&
          lastSentCoordsRef.current.lon === currentLon
        ) {
          return;
        }

        // 4. Send
        const channel = `rider.${user.id}.status` as const;
        clientSocket.emit(channel, {
          userId: user.id,
          latitude: currentLat,
          longitude: currentLon,
        });

        // 5. Update tracking refs/state
        lastSentCoordsRef.current = { lat: currentLat, lon: currentLon };
        setLastUpdate(new Date().toISOString());
      } catch (error) {
        if (__DEV__) console.warn("Location update error:", error);
      }
    };

    // Run immediately
    checkAndSendLocation();

    // Run interval
    const intervalId = setInterval(checkAndSendLocation, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [status, clientSocket, user?.id, getUserLocation]);

  const setActive = useCallback(
    async (active: boolean) => {
      // ensure we have fresh coords when toggling
      setStatus(active ? "active" : "inactive");
      await getUserLocation(false);
      const lat = latitude != null ? String(latitude) : null;
      const lon = longitude != null ? String(longitude) : null;
      const nextStatus: RiderActiveStatus = active ? "active" : "inactive";

      if (clientSocket) {
        clientSocket.emit("active.status", {
          status: nextStatus,
          latitude: lat,
          longitude: lon,
          userId: user?.id,
        });
        setLastUpdate(new Date().toISOString());
      }
    },
    [getUserLocation, latitude, longitude, clientSocket, user?.id]
  );

  return {
    status,
    isActive: status === "active",
    loading,
    lastUpdate,
    setActive,
  };
}
