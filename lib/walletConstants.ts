export const WALLET_COLORS = {
  primary: "#00B624",
  error: "#ef4444",
  success: "#16a34a",
  warning: "#d97706",
  gray: "#6b7280",
  lightGray: "#64748b",
  background: "#f8fafc",
  white: "#fff",
  border: "#f1f5f9",
  inputBorder: "#e2e8f0",
  disabled: "#94a3b8",
} as const;

export const TRANSACTION_TYPES = {
  delivery: "delivery",
  withdrawal: "withdrawal",
  earning: "earning",
  deposit: "deposit",
  reward: "reward",
} as const;

export const TRANSACTION_STATUSES = {
  complete: "complete",
  failed: "failed",
  refunded: "refunded",
} as const;

export const WEEK_FILTER_OPTIONS = {
  this_week: "this_week",
  last_week: "last_week",
  last_2_weeks: "last_2_weeks",
  last_4_weeks: "last_4_weeks",
  all: "all",
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];
export type TransactionStatus =
  (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];
export type WeekFilterOption =
  (typeof WEEK_FILTER_OPTIONS)[keyof typeof WEEK_FILTER_OPTIONS];

export const getTransactionIcon = (type: TransactionType): string => {
  switch (type) {
    case "delivery":
      return "bicycle";
    case "earning":
      return "trending-up";
    case "withdrawal":
      return "arrow-down";
    default:
      return "wallet";
  }
};

export const getTransactionColor = (
  type: TransactionType,
  amount: number
): string => {
  if (amount < 0) return WALLET_COLORS.error;
  return type === "delivery" || type === "earning"
    ? WALLET_COLORS.primary
    : WALLET_COLORS.gray;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
