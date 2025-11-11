// typescript
import { useEffect, useState, useCallback, useRef } from "react";
import { riderService, RiderActiveStatus } from "@/lib/api";
import { useDeviceLocation } from "@/hooks/location.hook";
import { useUser } from "../redux/hooks/hooks";
import { io } from "socket.io-client";
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
  const lastEmitAtRef = useRef<number>(0);
  const lastCoordsRef = useRef<{ lat?: string | null; lon?: string | null }>(
    {}
  );

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

  // Emit movement updates while active. Throttle and dedupe identical coords.
  useEffect(() => {
    const THROTTLE_MS = 2000;
    if (!clientSocket) return;
    if (status !== "active") return;
    if (!user?.id) return;
    if (latitude == null || longitude == null) return;

    const lat = String(latitude);
    const lon = String(longitude);
    const now = Date.now();

    // dedupe identical coords
    if (
      lastCoordsRef.current.lat === lat &&
      lastCoordsRef.current.lon === lon
    ) {
      return;
    }

    // throttle
    if (now - lastEmitAtRef.current < THROTTLE_MS) {
      return;
    }

    const channel = `rider.${user.id}.status` as const;
    clientSocket.emit(channel, {
      userId: user.id,
      latitude: lat,
      longitude: lon,
    });

    lastEmitAtRef.current = now;
    lastCoordsRef.current = { lat, lon };
    setLastUpdate(new Date().toISOString());
  }, [latitude, longitude, clientSocket, status, user?.id]);

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
