import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastConfig {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (ToastConfig & { id: number }) | null;
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<(ToastConfig & { id: number }) | null>(
    null
  );
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const showToast = useCallback(
    (config: ToastConfig) => {
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const id = Date.now();
      setToast({ ...config, id });

      // Auto-dismiss after duration (default 3 seconds)
      const duration = config.duration ?? 3000;
      const newTimeoutId = setTimeout(() => {
        setToast(null);
      }, duration);
      setTimeoutId(newTimeoutId);
    },
    [timeoutId]
  );

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
};
