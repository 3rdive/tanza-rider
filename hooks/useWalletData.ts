import { useState, useEffect } from "react";
import { walletService, IRiderWallet } from "../lib/api";

export const useWalletData = () => {
  const [walletData, setWalletData] = useState<IRiderWallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await walletService.getRiderWallet();
      if (response.success && response.data) {
        setWalletData(response.data);
      } else {
        setError(response.message || "Failed to fetch wallet data");
      }
    } catch (err: any) {
      console.error("Error fetching wallet data:", err);
      setError(err?.response?.data?.message || "Failed to load wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const refetch = () => {
    fetchWalletData();
  };

  return {
    walletData,
    isLoading,
    error,
    refetch,
  };
};
