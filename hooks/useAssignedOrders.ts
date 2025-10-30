import { useState, useCallback, useEffect, useRef } from "react";
import { orderService, IAssignedOrder } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useActiveOrders } from "@/hooks/useActiveOrders";
import { useUser } from "../redux/hooks/hooks";

export const useAssignedOrders = () => {
  const { refetch: refetchActiveOrders } = useActiveOrders();
  const { user, access_token } = useUser();
  const [assignedOrders, setAssignedOrders] = useState<IAssignedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null
  );
  const socketRef = useRef<Socket | null>(null);
  const [newOrderReceived, setNewOrderReceived] =
    useState<IAssignedOrder | null>(null);

  const fetchAssignedOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getAssignedOrders();
      setAssignedOrders(response.data || []);
    } catch (err: any) {
      console.error("Error fetching assigned orders:", err);
      setError(
        err?.response?.data?.message || "Failed to fetch assigned orders"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection and listener
  useEffect(() => {
    let mounted = true;

    const initializeSocket = async () => {
      try {
        const userId = user?.id;
        // Create socket connection
        const socket = createSocket({ token: access_token });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Socket connected for assigned orders");

          // Join the rider's pending order channel
          const channel = `rider.${userId}.pending.order`;
          console.log(`Joining channel: ${channel}`);
          socket.emit("join", channel);
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
        });

        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err.message);
        });

        // Listen for new pending orders
        const channel = `rider.${userId}.pending.order`;
        socket.on(channel, (data: IAssignedOrder) => {
          if (!mounted) return;

          console.log("New pending order received:", data);

          // Add to assigned orders list
          setAssignedOrders((prev) => {
            // Check if order already exists
            const exists = prev.some((order) => order.id === data.id);
            if (exists) return prev;
            return [data, ...prev];
          });

          // Set as new order for notification
          setNewOrderReceived(data);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Fetch assigned orders on mount
  useEffect(() => {
    fetchAssignedOrders();
  }, [fetchAssignedOrders]);

  // Clear new order notification
  const clearNewOrder = useCallback(() => {
    setNewOrderReceived(null);
  }, []);

  // Remove an order from the list (after accept/decline)
  const removeOrder = useCallback((orderId: string) => {
    setAssignedOrders((prev) => prev.filter((order) => order.id !== orderId));
  }, []);

  // Accept an order
  const acceptOrder = useCallback(
    async (orderId: string) => {
      try {
        setProcessingOrderId(orderId);
        setError(null);
        const response = await orderService.riderFeedback({
          orderId,
          accepted: true,
        });

        if (response.success) {
          // Remove from assigned orders list
          removeOrder(orderId);
          // Refetch active orders to show the newly accepted order
          refetchActiveOrders();
          return { success: true, message: response.message };
        } else {
          throw new Error(response.message || "Failed to accept order");
        }
      } catch (err: any) {
        console.error("Error accepting order:", err);
        const errorMessage =
          err?.response?.data?.message || "Failed to accept order";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setProcessingOrderId(null);
      }
    },
    [removeOrder, refetchActiveOrders]
  );

  // Decline an order
  const declineOrder = useCallback(
    async (orderId: string) => {
      try {
        setProcessingOrderId(orderId);
        setError(null);
        const response = await orderService.riderFeedback({
          orderId,
          accepted: false,
        });

        if (response.success) {
          // Remove from assigned orders list
          removeOrder(orderId);
          refetchActiveOrders();

          return { success: true, message: response.message };
        } else {
          throw new Error(response.message || "Failed to decline order");
        }
      } catch (err: any) {
        console.error("Error declining order:", err);
        const errorMessage =
          err?.response?.data?.message || "Failed to decline order";
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setProcessingOrderId(null);
      }
    },
    [removeOrder, refetchActiveOrders]
  );

  return {
    assignedOrders,
    loading,
    error,
    processingOrderId,
    refetch: fetchAssignedOrders,
    newOrderReceived,
    clearNewOrder,
    removeOrder,
    acceptOrder,
    declineOrder,
  };
};
