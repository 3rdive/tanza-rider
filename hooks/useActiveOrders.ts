import { useState, useCallback, useEffect } from "react";
import { orderService, IActiveOrder } from "@/lib/api";

export const useActiveOrders = () => {
  const [activeOrders, setActiveOrders] = useState<IActiveOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getActiveOrders();
      setActiveOrders(response.data || []);
    } catch (err: any) {
      console.error("Error fetching active orders:", err);
      setError(err?.response?.data?.message || "Failed to fetch active orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatically fetch on mount
  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders]);

  return {
    activeOrders,
    loading,
    error,
    refetch: fetchActiveOrders,
  };
};
