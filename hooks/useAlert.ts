import { useCallback } from "react";
import { useAppDispatch } from "@/redux/hooks/hooks";
import {
  showAlert as showAlertAction,
  hideAlert as hideAlertAction,
} from "@/redux/slices/alertSlice";

export type AlertKind = "success" | "error" | "warning";

export interface AlertOptions {
  heading?: string;
  message?: string;
  duration?: number | null;
}

/**
 * useAlert - convenience hook to trigger global alerts
 * Wraps Redux actions and exposes typed helpers
 */
export function useAlert() {
  const dispatch = useAppDispatch();

  const show = useCallback(
    (type: AlertKind, opts: AlertOptions = {}) => {
      dispatch(
        showAlertAction({
          heading: opts.heading,
          message: opts.message,
          duration: opts.duration,
          type,
        })
      );
    },
    [dispatch]
  );

  const success = useCallback(
    (opts: AlertOptions = {}) => show("success", opts),
    [show]
  );
  const error = useCallback(
    (opts: AlertOptions = {}) => show("error", opts),
    [show]
  );
  const warning = useCallback(
    (opts: AlertOptions = {}) => show("warning", opts),
    [show]
  );

  const hide = useCallback(() => dispatch(hideAlertAction()), [dispatch]);

  return { show, success, error, warning, hide } as const;
}
