import axios, { AxiosInstance, isAxiosError } from "axios";

export const BASE_URL = "http://localhost:3030";
export const AXIOS: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Interceptors: log requests and responses
const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";

// Request interceptor
AXIOS.interceptors.request.use(
  (config) => {
    // Ensure Authorization header is synced with the global axios default if not explicitly set
    const globalAuth = (axios.defaults.headers.common || ({} as any))[
      "Authorization"
    ] as string | undefined;
    const hasAuthOnConfig = !!(config.headers as any)?.Authorization;
    if (!hasAuthOnConfig && globalAuth) {
      (config.headers as any) = {
        ...(config.headers as any),
        Authorization: globalAuth,
      };
    }

    if (isDev) {
      const rawHeaders = config.headers as any;
      const headers =
        typeof rawHeaders?.toJSON === "function"
          ? rawHeaders.toJSON()
          : rawHeaders;

      // Redact sensitive headers
      // const safeHeaders: Record<string, unknown> = { ...(headers || {}) };
      // if (safeHeaders.Authorization)
      //   safeHeaders.Authorization = "***redacted***";

      // console.log("[Axios Request]", {
      //   baseURL: config.baseURL,
      //   method: config.method,
      //   url: config.url,
      //   params: config.params,
      //   headers: safeHeaders,
      //   data: config.data,
      //   timeout: config.timeout,
      // });
    }
    return config;
  },
  (error) => {
    if (isDev) {
      console.error("[Axios Request Error]", {
        message: error?.message,
        stack: error?.stack,
      });
    }
    return Promise.reject(error);
  }
);

// Response interceptor
AXIOS.interceptors.response.use(
  (response) => {
    if (isDev) {
      // const rawHeaders = response.headers as any;
      // const headers =
      //   typeof rawHeaders?.toJSON === "function"
      //     ? rawHeaders.toJSON()
      //     : rawHeaders;

      // console.log("[Axios Response]", {
      //   method: response.config?.method,
      //   url: response.config?.url,
      //   status: response.status,
      //   statusText: response.statusText,
      //   headers,
      //   data: response.data,
      // });
    }
    return response;
  },
  (error) => {
    if (isDev) {
      if (isAxiosError(error)) {
        const res = error.response;
        console.error("[Axios Response Error]", {
          method: error.config?.method,
          url: error.config?.url,
          status: res?.status,
          statusText: res?.statusText,
          data: res?.data,
          message: error.message,
        });
      } else {
        console.error("[Axios Response Error]", error);
      }
    }
    return Promise.reject(error);
  }
);

// Types
export type Role = "user" | "admin" | string;

export interface IUsersAddress {
  name: string;
  lat: number;
  lon: number;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  mobile: string;
  profilePic: string | null;
  countryCode: string;
  registrationDate: Date | string;
  updatedAt: Date | string;
  registrationMode: "google" | "apple" | "manual";
  usersAddress?: IUsersAddress | null;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IAuthSuccessData {
  access_token: string | null;
  user: IUser | null;
}

export interface ILoginPayload {
  emailOrMobile: string;
  password: string;
}

export interface ISignUpPayload {
  lastName: string;
  firstName: string;
  mobile: string;
  password: string;
  otp: string;
  profilePic?: string | null;
  countryCode: string; // e.g. "+234"
}

export interface IOtpPayload {
  otpType: "MOBILE" | "EMAIL";
  reference: string; // phone or email
}

export interface IOtpConsumePayload extends IOtpPayload {
  code: string;
}

export interface IResetPasswordPayload {
  password: string;
  reference: string;
  code: string;
}

export const authService = {
  login: async (payload: ILoginPayload) => {
    const { data } = await AXIOS.post<IApiResponse<IAuthSuccessData>>(
      "/api/v1/auth/login",
      payload
    );
    return data;
  },
  signUp: async (payload: ISignUpPayload) => {
    const { data } = await AXIOS.post<IApiResponse<IAuthSuccessData>>(
      "/api/v1/auth/sign-up",
      payload
    );
    return data;
  },
  sendOtp: async (payload: IOtpPayload) => {
    const { data } = await AXIOS.post<IApiResponse<string>>(
      "/api/v1/otp",
      payload
    );
    return data;
  },
  consumeOtp: async (payload: IOtpConsumePayload) => {
    const { data } = await AXIOS.post<IApiResponse<{ message: string }>>(
      "/api/v1/otp/consume",
      payload
    );
    return data;
  },
  resetPassword: async (payload: IResetPasswordPayload) => {
    const { data } = await AXIOS.post<IApiResponse<string>>(
      "/api/v1/auth/reset-password",
      payload
    );
    return data;
  },
  // New: unified existence check by email or mobile
  checkExisting: async (emailOrMobile: string) => {
    const { data } = await AXIOS.get<
      IApiResponse<{ exists: boolean; registrationMode?: string }>
    >("/api/v1/auth/check-existing", { params: { emailOrMobile } });
    return data;
  },
  userExistsByMobile: async (mobile: string) => {
    const { data } = await AXIOS.get<IApiResponse<any>>(
      "/api/v1/user/exists/mobile",
      { params: { mobile } }
    );
    // Support either {data: {exists:boolean}} or {data:boolean}
    const exists = (data as any)?.data?.exists ?? (data as any)?.data ?? false;
    return Boolean(exists);
  },
  userExistsByEmail: async (email: string) => {
    const { data } = await AXIOS.get<IApiResponse<any>>(
      "/api/v1/user/exists/email",
      { params: { email } }
    );
    const exists = (data as any)?.data?.exists ?? (data as any)?.data ?? false;
    return Boolean(exists);
  },
} as const;

export type AuthService = typeof authService;

// Wallet & Transactions
export interface IWallet {
  id: string;
  walletBalance: number;
  createdAt: string;
  isFrozen: boolean;
  customerCode: string;
}

export interface IRiderWallet {
  id: string;
  walletBalance: number;
  createdAt: string;
  isFrozen: boolean;
  customerCode: string | null;
  totalAmountEarned: number;
}

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | string;
export interface ITransaction {
  id: string;
  amount: number;
  type: TransactionType;
  createdAt: string;
  orderId: string | null;
  description: string;
  status: string;
}

export interface IPaginated<T> {
  total: number;
  page: number;
  take: number;
  totalPages: number;
  data?: T[]; // when the API wraps it differently
}

export interface IVirtualAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  customerCode: string;
}

export const walletService = {
  getWallet: async () => {
    const { data } = await AXIOS.get<IApiResponse<IWallet>>("/api/v1/wallet");
    return data;
  },
  getRiderWallet: async () => {
    const { data } = await AXIOS.get<IApiResponse<IRiderWallet>>(
      "/api/v1/wallet/rider"
    );
    return data;
  },
  getVirtualAccount: async () => {
    const { data } = await AXIOS.get<IApiResponse<IVirtualAccount>>(
      "/api/v1/wallet/virtual-account"
    );
    return data;
  },
  fund: async (payload: IFundWallet) => {
    const { data } = await AXIOS.post<IApiResponse<string>>(
      "/api/v1/wallet/fund",
      payload
    );
    return data;
  },
} as const;

// User Profile & Password
export interface IUpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  profilePic?: string | null;
  countryCode?: string;
  email?: string;
  mobile?: string;
  usersAddress?: IUsersAddress;
}

export interface IUpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IFundWallet {
  customerCode: string;
  transactionReference: string;
}
export const userService = {
  updateProfile: async (payload: IUpdateProfilePayload) => {
    const { data } = await AXIOS.put<IApiResponse<IUser>>(
      "/api/v1/user/profile",
      payload
    );
    return data;
  },
  updatePassword: async (payload: IUpdatePasswordPayload) => {
    const { data } = await AXIOS.put<IApiResponse<string>>(
      "/api/v1/user/password/update",
      payload
    );
    return data;
  },
  getProfile: async () => {
    const { data } = await AXIOS.get<IApiResponse<IUser>>(
      "/api/v1/user/profile"
    );
    return data;
  },
} as const;

export interface IOrderTracking {
  id: string;
  status: string; // e.g., pending, accepted, picked_up, transit, delivered, cancelled
  note: string | null;
  createdAt: string;
  updatedAt: string;
  orderId: string;
}

export interface IOrderData {
  id: string;
  sender: any;
  recipient: any;
  pickUpLocation: string;
  dropOffLocation: string;
  userOrderRole: string;
  vehicleType: string;
  noteForRider: string | null;
  serviceChargeAmount: number | string;
  deliveryFee: number | string;
  totalAmount: number | string;
  eta: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  orderTracking?: IOrderTracking[];
}

export interface ITransactionDetail {
  id: string;
  walletId: string;
  userId: string;
  amount: number | string;
  reference: string | null;
  orderId: string | null;
  order: IOrderData | null;
  type: string; // e.g., ORDER, DEPOSIT
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export const transactionService = {
  getRecent: async (params: {
    limit: number;
    page: number;
    transactionType?: "ORDER" | "DEPOSIT" | string;
    startDate?: string;
    endDate?: string;
  }) => {
    const { data } = await AXIOS.get<
      IApiResponse<ITransaction[]> & { pagination: IPaginated<ITransaction> }
    >("/api/v1/transaction", { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await AXIOS.get<IApiResponse<ITransactionDetail | null>>(
      `/api/v1/transaction/${id}`
    );
    return data;
  },
} as const;

// Location Search

// Order & Pricing
export interface ICalculateChargeParams {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  vehicleType: string; // e.g., bicycle | bike | van etc.
}

export interface ICalculateChargeData {
  totalAmount: number;
  deliveryFee: number;
  serviceCharge: number;
  duration: string; // e.g., "2 minutes 30 seconds"
}

export interface ICreateOrderPayload {
  dropOffLocation: string;
  pickUpLocation: string;
  userOrderRole: "sender" | "recipient" | string;
  vehicleType: string; // e.g., bike
  noteForRider?: string | null;
}

// export interface IOrderData {
//   id: string;
//   sender: any;
//   recipient: any;
//   pickUpLocation: string;
//   dropOffLocation: string;
//   userOrderRole: string;
//   vehicleType: string;
//   noteForRider: string | null;
//   serviceChargeAmount: number;
//   deliveryFee: number;
//   totalAmount: number;
//   eta: string;
//   userId: string;
//   createdAt: string;
//   updatedAt: string;
// }

export interface IOrderHistoryItem {
  id: string;
  pickUpLocationAddress: string;
  dropOffLocationAddress: string;
  userOrderRole: string;
  deliveryFee: number;
  updatedAt: string;
  eta: string;
  riderRewarded: boolean;
}

export interface IOrderHistoryParams {
  limit: number;
  page: number;
  orderStatus: string[]; // Can pass multiple statuses
}

export interface IOrderHistoryResponse {
  data: IOrderHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IOrderLocation {
  address: string;
  latitude: string;
  longitude: string;
}

export interface IOrderDetail {
  id: string;
  sender: any;
  recipient: any;
  pickUpLocation: IOrderLocation;
  dropOffLocation: IOrderLocation;
  userOrderRole: string;
  vehicleType: string;
  noteForRider: string;
  serviceChargeAmount: number;
  deliveryFee: number;
  totalAmount: number;
  orderTracking: IOrderTracking[];
  eta: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  riderId: string;
  riderAssigned: boolean;
  riderAssignedAt: string;
  hasRewardedRider: boolean;
}

export type OrderTrackingStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "transit"
  | "delivered"
  | "cancelled"
  | string;

export interface IActiveOrderTracking {
  id: string;
  status: OrderTrackingStatus;
  createdAt: string;
}

export interface IActiveOrder {
  orderId: string;
  userId: string;
  note: string;
  userFullName: string;
  userMobileNumber: string;
  profilePicUrl: string;
  amount: number;
  pickUpLocation: {
    address: string;
    latitude: string;
    longitude: string;
  };
  dropOffLocation: {
    address: string;
    latitude: string;
    longitude: string;
  };
  orderTracking: IActiveOrderTracking[];
}

export interface IAssignedOrder {
  id: string;
  userId: string;
  userFullName: string;
  userMobileNumber: string;
  profilePicUrl: string;
  pickUpLocation: {
    address: string;
    latitude: string;
    longitude: string;
  };
  dropOffLocation: {
    address: string;
    latitude: string;
    longitude: string;
  };
  eta: string;
  amount: number;
  distanceInKm: string;
  isUrgent: boolean;
}

export interface IRiderFeedbackPayload {
  orderId: string;
  accepted: boolean;
}

export const orderService = {
  calculateCharge: async (params: ICalculateChargeParams) => {
    const { data } = await AXIOS.get<IApiResponse<ICalculateChargeData>>(
      "/api/v1/order/calculate-charge",
      { params }
    );
    return data;
  },
  create: async (
    query: {
      startLat: number;
      startLon: number;
      endLat: number;
      endLon: number;
      vehicleType: string;
    },
    payload: ICreateOrderPayload
  ) => {
    const { data } = await AXIOS.post<IApiResponse<IOrderData>>(
      "/api/v1/order",
      payload,
      { params: query }
    );
    return data;
  },
  getOrderHistory: async (params: IOrderHistoryParams) => {
    const { data } = await AXIOS.get<
      IApiResponse<IOrderHistoryItem[]> & {
        pagination: IOrderHistoryResponse["pagination"];
      }
    >("/api/v1/order/orders/rider", {
      params,
      paramsSerializer: {
        indexes: null, // This will serialize array params as: orderStatus=value1&orderStatus=value2
      },
    });
    return data;
  },
  getOrderById: async (orderId: string) => {
    const { data } = await AXIOS.get<IApiResponse<IOrderDetail>>(
      `/api/v1/order/${orderId}`
    );
    return data;
  },
  /**
   * Get active orders for the current rider
   */
  getActiveOrders: async () => {
    const { data } = await AXIOS.get<IApiResponse<IActiveOrder[]>>(
      "/api/v1/order/active-orders"
    );
    return data;
  },
  /**
   * Get assigned orders (pending that hasn't been accepted) for the current rider
   */
  getAssignedOrders: async () => {
    const { data } = await AXIOS.get<IApiResponse<IAssignedOrder[]>>(
      "/api/v1/order/assigned-orders"
    );
    return data;
  },
  /**
   * Provide rider feedback (accept/decline) for an assigned order
   */
  riderFeedback: async (payload: IRiderFeedbackPayload) => {
    const { data } = await AXIOS.post<IApiResponse<string>>(
      "/api/v1/order/rider-feedback",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return data;
  },
  /**
   * Create a new order tracking entry (e.g., accept, picked_up, delivered)
   */
  track: async (payload: ICreateOrderTrackingPayload) => {
    const { data } = await AXIOS.post<IApiResponse<IOrderTracking>>(
      "/api/v1/order/tracking",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return data;
  },
} as const;

export interface ICreateOrderTrackingPayload {
  orderId: string;
  note?: string;
  status: OrderTrackingStatus;
}

export interface ILocationFeatureProperties {
  osm_type: string;
  osm_id: number;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  postcode?: string;
  housenumber?: string;
  countrycode?: string;
  name?: string;
  country?: string;
  city?: string;
  street?: string;
  state?: string;
  county?: string;
  extent?: number[];
}

export interface ILocationFeatureGeometry {
  type: "Point" | string;
  coordinates: [number, number]; // [lon, lat]
}

export interface ILocationFeature {
  type: string;
  properties: ILocationFeatureProperties;
  geometry: ILocationFeatureGeometry;
}

export const locationService = {
  search: async (q: string) => {
    const { data } = await AXIOS.get<IApiResponse<ILocationFeature[]>>(
      "/api/v1/location/search",
      { params: { q } }
    );
    return data;
  },
  reverse: async (lat: number, lon: number) => {
    const { data } = await AXIOS.get<IApiResponse<any>>(
      "/api/v1/location/reverse",
      { params: { lat, lon } }
    );
    return data;
  },
} as const;

// Storage Media Upload Service
export interface IRateRiderPayload {
  riderId: string;
  score: number; // 1-5
  comment?: string;
}

export const ratingsService = {
  rate: async (payload: IRateRiderPayload) => {
    const { data } = await AXIOS.post<IApiResponse<{ message: string }>>(
      "/api/v1/ratings/rate",
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return data;
  },
} as const;

// Rider
export interface IRider {
  id: string;
  userId: string;
  vehicleType?: string | null;
  vehiclePhoto?: string | null;
  driverLicense?: string | null;
  vehiclePapers?: string | null;
  documentStatus?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpdateRiderPayload {
  vehicleType?: string;
  vehiclePhoto?: string | null;
  driverLicense?: string | null;
  vehiclePapers?: string[] | null;
  documentStatus?: string;
  rejectionReason?: string | null;
}

export const riderService = {
  getMe: async () => {
    const { data } = await AXIOS.get<IApiResponse<IRider>>("/api/v1/riders/me");
    return data;
  },
  updateMe: async (payload: IUpdateRiderPayload) => {
    const { data } = await AXIOS.patch<IApiResponse<IRider>>(
      "/api/v1/riders/me",
      payload
    );
    return data;
  },
  /**
   * Get rider active status and last known coordinates
   */
  getActiveStatus: async () => {
    const { data } = await AXIOS.get<IApiResponse<IRiderActiveStatus>>(
      "/api/v1/riders/active-status"
    );
    return data;
  },
  /**
   * Update rider active status and optionally location
   */
  updateActiveStatus: async (payload: IUpdateRiderActiveStatusPayload) => {
    const { data } = await AXIOS.put<IApiResponse<IRiderActiveStatus>>(
      "/api/v1/riders/active-status",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return data;
  },
} as const;

// Rider Active Status
export type RiderActiveStatus = "active" | "inactive" | string;

export interface IRiderActiveStatus {
  id: string;
  status: RiderActiveStatus;
  userId: string;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateRiderActiveStatusPayload {
  status: RiderActiveStatus;
  latitude?: string | null;
  longitude?: string | null;
}

export const storageService = {
  upload: async (file: { uri: string; name?: string; type?: string }) => {
    const form = new FormData();
    const filename =
      file.name || file.uri.split("/").pop() || `upload-${Date.now()}.jpg`;
    const mimetype = file.type || "image/jpeg";
    form.append("file", {
      // @ts-ignore React Native FormData file
      uri: file.uri,
      name: filename,
      type: mimetype,
    } as any);

    const { data } = await AXIOS.post<
      IApiResponse<{
        filename: string;
        mimetype: string;
        size: number;
        url: string;
      }>
    >("/api/v1/storage-media/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
} as const;

// Withdrawal Options
export interface IWithdrawalOption {
  id: string;
  riderId: string;
  bankName: string;
  slug: string | null;
  accountNumber: string;
  bankHoldersName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAddWithdrawalOptionPayload {
  bankName: string;
  accountNumber: string;
  bankHoldersName: string;
  slug: string;
}

export interface IBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  supports_transfer: boolean;
  available_for_direct_debit: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAccountValidation {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export const withdrawalService = {
  getAll: async () => {
    const { data } = await AXIOS.get<IApiResponse<IWithdrawalOption[]>>(
      "/api/v1/wallet/withdrawal-options"
    );
    return data;
  },
  add: async (payload: IAddWithdrawalOptionPayload) => {
    const { data } = await AXIOS.post<IApiResponse<IWithdrawalOption>>(
      "/api/v1/wallet/withdrawal-options",
      payload
    );
    return data;
  },
  setDefault: async (id: string) => {
    const { data } = await AXIOS.patch<IApiResponse<IWithdrawalOption>>(
      `/api/v1/wallet/withdrawal-options/${id}/default`
    );
    return data;
  },
  delete: async (id: string) => {
    const { data } = await AXIOS.delete<IApiResponse<{ success: boolean }>>(
      `/api/v1/wallet/withdrawal-options/${id}`
    );
    return data;
  },
  searchBanks: async (query: string) => {
    const { data } = await AXIOS.get<IApiResponse<IBank[]>>(
      "/api/v1/wallet/banks",
      { params: { query } }
    );
    return data;
  },
  validateAccount: async (accountNumber: string, bankCode: string) => {
    const { data } = await AXIOS.get<IApiResponse<IAccountValidation>>(
      "/api/v1/wallet/banks/validate",
      { params: { account_number: accountNumber, bank_code: bankCode } }
    );
    return data;
  },
} as const;

// Notifications
export interface INotificationItem {
  id: string;
  title: string;
  text: string;
  userId: string;
  redirect_to?: string | null;
  hasSeen: boolean;
  created_at: string;
  updated_at: string;
}

export interface INotificationPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface INotificationListResponse {
  success: boolean;
  message: string;
  data: INotificationItem[];
  pagination: INotificationPagination;
}

export interface IMarkAsSeenPayload {
  notificationIds: string[];
}

export interface IMarkAsSeenResponse {
  success: boolean;
  message: string;
  data: { message: string; updatedCount: number };
}

export const notificationService = {
  list: async (params: { page?: number; limit?: number }) => {
    const { data } = await AXIOS.get<INotificationListResponse>(
      "/api/v1/notification",
      { params }
    );
    return data;
  },
  markAsSeen: async (payload: IMarkAsSeenPayload) => {
    const { data } = await AXIOS.put<IMarkAsSeenResponse>(
      "/api/v1/notification/mark-as-seen",
      payload
    );
    return data;
  },
} as const;
