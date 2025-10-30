import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchRiderMe, updateRiderMe } from "@/redux/slices/riderSlice";
import { IUpdateRiderPayload } from "@/lib/api";

export const useRider = () => {
  const dispatch = useDispatch<AppDispatch>();
  const riderState = useSelector((state: RootState) => state.rider);

  // Fetch rider info
  const fetchRider = useCallback(() => {
    return dispatch(fetchRiderMe());
  }, [dispatch]);

  // Update rider info
  const updateRider = useCallback(
    (payload: IUpdateRiderPayload) => {
      return dispatch(updateRiderMe(payload));
    },
    [dispatch]
  );

  // Get document status
  const documentStatus = riderState?.data?.documentStatus || "";

  // Get rejection reason
  const rejectionReason = riderState?.data?.rejectionReason || null;

  // Determine if editing is allowed (only INITIAL or REJECTED)
  const isEditable =
    documentStatus === "INITIAL" || documentStatus === "REJECTED";

  useEffect(() => {
    fetchRider();
  }, [fetchRider]);

  return {
    // State
    rider: riderState?.data,
    loading: riderState?.loading,
    error: riderState?.error,
    updating: riderState?.updating,
    updateError: riderState?.updateError,
    documentStatus,
    rejectionReason,
    isEditable,

    // Actions
    fetchRider,
    updateRider,
  };
};
