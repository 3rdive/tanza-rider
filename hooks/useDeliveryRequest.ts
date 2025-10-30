import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import {
  showDeliveryRequest as showDeliveryRequestAction,
  hideDelivery as hideDeliveryAction,
  acceptDeliveryRequest as acceptDeliveryRequestAction,
  declineDeliveryRequest as declineDeliveryRequestAction,
  DeliveryRequest,
} from "@/redux/slices/deliveryRequestSlice";

/**
 * Custom hook for managing delivery request state and actions
 * @returns Delivery request state and action dispatchers
 */
export const useDeliveryRequest = () => {
  const dispatch = useDispatch();

  const { showDeliveryModal, currentRequest } = useSelector(
    (state: RootState) => state.deliveryRequest
  );

  const showDeliveryRequest = (request: DeliveryRequest) => {
    dispatch(showDeliveryRequestAction(request));
  };

  const hideDelivery = () => {
    dispatch(hideDeliveryAction());
  };

  const acceptDeliveryRequest = () => {
    dispatch(acceptDeliveryRequestAction());
  };

  const declineDeliveryRequest = () => {
    dispatch(declineDeliveryRequestAction());
  };

  return {
    // State
    showDeliveryModal,
    currentRequest,
    // Actions
    showDeliveryRequest,
    hideDelivery,
    acceptDeliveryRequest,
    declineDeliveryRequest,
  };
};
