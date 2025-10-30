import { useState, useCallback } from "react";
import { orderService, IOrderHistoryItem } from "@/lib/api";

export type OrderTab = "Upcoming" | "Ongoing" | "Completed";

const ORDER_STATUS_MAP: Record<OrderTab, string[]> = {
  Upcoming: ["pending"],
  Ongoing: ["accepted", "picked_up"],
  Completed: ["delivered", "cancelled"],
};

export const useOrders = () => {
  const [orders, setOrders] = useState<IOrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderTab>("Ongoing");

  const fetchOrders = useCallback(
    async (tab: OrderTab, page: number = 1, isRefresh: boolean = false) => {
      try {
        console.log("Fetching orders for tab:", tab, "page:", page);
        if (isRefresh) {
          setRefreshing(true);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await orderService.getOrderHistory({
          limit: 20,
          page,
          orderStatus: ORDER_STATUS_MAP[tab],
        });

        const newOrders = response.data || [];

        if (page === 1) {
          setOrders(newOrders);
        } else {
          setOrders((prev) => [...prev, ...newOrders]);
        }

        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const onRefresh = useCallback(() => {
    setCurrentPage(1);
    fetchOrders(activeTab, 1, true);
  }, [activeTab, fetchOrders]);

  const loadMore = useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      fetchOrders(activeTab, currentPage + 1);
    }
  }, [activeTab, currentPage, totalPages, loadingMore, fetchOrders]);

  const changeTab = useCallback(
    (tab: OrderTab) => {
      setActiveTab(tab);
      setCurrentPage(1);
      setOrders([]);
      fetchOrders(tab, 1);
    },
    [fetchOrders]
  );

  return {
    orders,
    loading,
    refreshing,
    loadingMore,
    activeTab,
    currentPage,
    totalPages,
    fetchOrders,
    onRefresh,
    loadMore,
    changeTab,
  };
};
