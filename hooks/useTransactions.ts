import { useState, useEffect, useCallback } from "react";
import {
  transactionService,
  ITransaction as IApiTransaction,
} from "../lib/api";

interface Transaction {
  id: string;
  type: "delivery" | "withdrawal" | "earning" | "deposit" | "reward";
  amount: number;
  description: string;
  date: string;
  status: "complete" | "failed" | "refunded";
  orderId?: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const mapApiTransaction = (t: IApiTransaction): Transaction => {
    let type: Transaction["type"] = "delivery";
    if (t.type === "ORDER") type = "delivery";
    else if (t.type === "DEPOSIT") type = "deposit";
    else if (t.type === "ORDER_REWARD") type = "reward";
    else if (t.type === "WITHDRAWAL") type = "withdrawal";
    else if (t.type === "FAILED_PAYOUT") type = "failed payout";
    else if (t.type === "SERVICE_CHARGE") type = "charge";
    else if (t.type === "SERVICE_CHARGE") type = "refund";

    let status: Transaction["status"] = "complete";
    if (t.status?.toLowerCase() === "complete") status = "complete";
    else if (t.status?.toLowerCase() === "failed") status = "failed";
    else if (t.status?.toLowerCase() === "refunded") status = "refunded";

    return {
      id: t.id,
      type,
      amount: Number(t.amount),
      description: t.description || `Transaction ${t.id.slice(0, 8)}`,
      date: t.createdAt,
      status,
      orderId: t.orderId || undefined,
    };
  };

  const fetchTransactions = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const response = await transactionService.getRecent({
          limit: 20,
          page,
        });

        if (response.success && response.data) {
          const mappedTransactions = response.data.map(mapApiTransaction);

          if (append) {
            setTransactions((prev) => [...prev, ...mappedTransactions]);
          } else {
            setTransactions(mappedTransactions);
          }

          if (response.pagination) {
            setTotalPages(response.pagination.totalPages);
            setCurrentPage(page);
            setHasMore(page < response.pagination.totalPages);
          }
        } else {
          setError(response.message || "Failed to fetch transactions");
        }
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError(err?.response?.data?.message || "Failed to load transactions");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTransactions(1, false);
  }, [fetchTransactions]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchTransactions(currentPage + 1, true);
    }
  }, [isLoadingMore, hasMore, isLoading, currentPage, fetchTransactions]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTransactions(1, false);
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};
