import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchActiveOrders,
  selectActiveOrders,
  selectActiveOrdersError,
  selectActiveOrdersLoading,
} from "@/redux/slices/activeOrdersSlice";

export const useActiveOrders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const activeOrders = useSelector(selectActiveOrders);
  const loading = useSelector(selectActiveOrdersLoading);
  const error = useSelector(selectActiveOrdersError);

  const refetch = useCallback(() => {
    dispatch(fetchActiveOrders());
  }, [dispatch]);

  // Automatically fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    activeOrders,
    loading,
    error,
    refetch,
  };
};
