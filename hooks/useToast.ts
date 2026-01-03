import { useToastContext, ToastConfig } from "@/context/ToastContext";

export const useToast = () => {
  const { showToast, hideToast } = useToastContext();

  return {
    showToast,
    hideToast,
    success: (title: string, message: string, duration?: number) => {
      showToast({ type: "success", title, message, duration });
    },
    error: (title: string, message: string, duration?: number) => {
      showToast({ type: "error", title, message, duration });
    },
    info: (title: string, message: string, duration?: number) => {
      showToast({ type: "info", title, message, duration });
    },
    warning: (title: string, message: string, duration?: number) => {
      showToast({ type: "warning", title, message, duration });
    },
  };
};
