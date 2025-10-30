import { useState, useEffect, useCallback } from "react";
import {
  withdrawalService,
  IWithdrawalOption,
  IAddWithdrawalOptionPayload,
} from "../lib/api";
import { StorageMechanics, StorageKeys } from "../lib/storage-mechanics";
import { isAxiosError } from "axios";

interface UseWithdrawalOptionsReturn {
  withdrawalOptions: IWithdrawalOption[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  addWithdrawalOption: (
    payload: IAddWithdrawalOptionPayload
  ) => Promise<IWithdrawalOption>;
  setDefaultOption: (id: string) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useWithdrawalOptions = (): UseWithdrawalOptionsReturn => {
  const [withdrawalOptions, setWithdrawalOptions] = useState<
    IWithdrawalOption[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load from cache first, then fetch from API
  const loadWithdrawalOptions = useCallback(
    async (isRefresh: boolean = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Load from cache first for better UX
        if (!isRefresh) {
          const cachedOptions = await StorageMechanics.get(
            StorageKeys.WITHDRAWAL_OPTIONS
          );
          if (cachedOptions && Array.isArray(cachedOptions)) {
            setWithdrawalOptions(cachedOptions);
            setIsLoading(false); // Show cached data immediately
          }
        }

        // Fetch fresh data from API
        const response = await withdrawalService.getAll();

        if (response.success && response.data) {
          const options = response.data;
          setWithdrawalOptions(options);

          // Cache the data
          await StorageMechanics.set(StorageKeys.WITHDRAWAL_OPTIONS, options);
        } else {
          throw new Error(response.message || "Failed to fetch options");
        }
      } catch (err) {
        const errorMessage = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
          ? err.message
          : "An error occurred while loading withdrawal options";
        setError(errorMessage);
        console.error("Load withdrawal options error:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    loadWithdrawalOptions();
  }, [loadWithdrawalOptions]);

  // Add a new withdrawal option
  const addWithdrawalOption = useCallback(
    async (
      payload: IAddWithdrawalOptionPayload
    ): Promise<IWithdrawalOption> => {
      try {
        setError(null);
        const response = await withdrawalService.add(payload);

        if (response.success && response.data) {
          const newOption = response.data;

          // Update local state
          const updatedOptions = [...withdrawalOptions, newOption];
          setWithdrawalOptions(updatedOptions);

          // Update cache
          await StorageMechanics.set(
            StorageKeys.WITHDRAWAL_OPTIONS,
            updatedOptions
          );

          return newOption;
        } else {
          throw new Error(
            response.message || "Failed to add withdrawal option"
          );
        }
      } catch (err) {
        const errorMessage = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
          ? err.message
          : "An error occurred while adding withdrawal option";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [withdrawalOptions]
  );

  // Set an option as default
  const setDefaultOption = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        const response = await withdrawalService.setDefault(id);

        if (response.success && response.data) {
          // Update local state - set all to false, then the selected one to true
          const updatedOptions = withdrawalOptions.map((opt) => ({
            ...opt,
            isDefault: opt.id === id,
          }));

          setWithdrawalOptions(updatedOptions);

          // Update cache
          await StorageMechanics.set(
            StorageKeys.WITHDRAWAL_OPTIONS,
            updatedOptions
          );
        } else {
          throw new Error(
            response.message || "Failed to set default withdrawal option"
          );
        }
      } catch (err) {
        const errorMessage = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
          ? err.message
          : "An error occurred while setting default option";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [withdrawalOptions]
  );

  // Delete an option
  const deleteOption = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        const response = await withdrawalService.delete(id);

        if (response.success) {
          // Update local state
          const updatedOptions = withdrawalOptions.filter(
            (opt) => opt.id !== id
          );
          setWithdrawalOptions(updatedOptions);

          // Update cache
          await StorageMechanics.set(
            StorageKeys.WITHDRAWAL_OPTIONS,
            updatedOptions
          );
        } else {
          throw new Error(
            response.message || "Failed to delete withdrawal option"
          );
        }
      } catch (err) {
        const errorMessage = isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
          ? err.message
          : "An error occurred while deleting option";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [withdrawalOptions]
  );

  // Refresh data
  const refresh = useCallback(async () => {
    await loadWithdrawalOptions(true);
  }, [loadWithdrawalOptions]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    withdrawalOptions,
    isLoading,
    isRefreshing,
    error,
    addWithdrawalOption,
    setDefaultOption,
    deleteOption,
    refresh,
    clearError,
  };
};
