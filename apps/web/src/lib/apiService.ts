import { api } from "./api";

/**
 * Standard API Response structure returned by the backend
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Helper to unwrap standard response data or throw descriptive error
 */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> | T }>): Promise<T> {
  try {
    const res = await promise;
    const responseData = res.data as any;
    if (responseData && typeof responseData === "object" && "success" in responseData) {
      if (!responseData.success) {
        throw new Error(responseData.error?.message || "Request failed");
      }
      return responseData.data;
    }
    return responseData;
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.error?.message ||
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "An unexpected error occurred";
    throw new Error(errorMsg);
  }
}

// ── Auth Service ─────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    unwrap<{ userId: string; devOtp?: string; message?: string }>(api.post("/auth/register", data)),

  verifyOtp: (data: { userId: string; otp: string }) =>
    unwrap<{ accessToken: string; refreshToken: string; user: any }>(api.post("/auth/verify-otp", data)),

  login: (data: { email: string; password: string }) =>
    unwrap<{ accessToken: string; refreshToken: string; user: any }>(api.post("/auth/login", data)),

  googleAuth: (data: { idToken: string }) =>
    unwrap<{ accessToken: string; refreshToken: string; user: any }>(api.post("/auth/oauth/google", data)),

  getProfile: () =>
    unwrap<any>(api.get("/auth/me")),

  updateProfile: (data: { name?: string; phone?: string }) =>
    unwrap<any>(api.patch("/auth/profile", data)),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    unwrap<{ message: string }>(api.post("/auth/change-password", data)),

  forgotPassword: (data: { email: string }) =>
    unwrap<{ message: string; devResetLink?: string }>(api.post("/auth/forgot-password", data)),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    unwrap<{ message: string }>(api.post("/auth/reset-password", data)),

  deleteAccount: (data: { password?: string; confirmation: "DELETE" }) =>
    unwrap<{ message: string }>(api.delete("/auth/account", { data })),

  logout: (refreshToken?: string) =>
    api.post("/auth/logout", { refreshToken }),
};

// ── Trips Service ────────────────────────────────────────────────────────────
export const tripsApi = {
  getUserTrips: () =>
    unwrap<{ trips: any[] }>(api.get("/trips")),

  createTrip: (data: any) =>
    unwrap<any>(api.post("/trips", data)),

  getPlans: (tripId: string) =>
    unwrap<any>(api.get(`/trips/${tripId}/plans`)),

  generatePlans: (tripId: string) =>
    unwrap<any>(api.post(`/trips/${tripId}/generate-plans`)),

  selectPlan: (tripId: string, planId: string) =>
    unwrap<any>(api.post(`/trips/${tripId}/select-plan`, { planId })),

  customizePlan: (tripId: string, data: any) =>
    unwrap<any>(api.patch(`/trips/${tripId}/customize`, data)),

  getStatus: (tripId: string) =>
    unwrap<any>(api.get(`/trips/${tripId}/status`)),

  getConfirmation: (tripId: string) =>
    unwrap<any>(api.get(`/trips/${tripId}/confirmation`)),

  getConsent: (tripId: string) =>
    unwrap<any>(api.post(`/trips/${tripId}/consent`)),
};

// ── Bookings Service ─────────────────────────────────────────────────────────
export const bookingsApi = {
  initiate: (data: any) =>
    unwrap<any>(api.post("/bookings/initiate", data)),

  cancel: (bookingId: string, reason?: string) =>
    unwrap<any>(api.post(`/bookings/${bookingId}/cancel`, { reason })),
};

// ── Vendors Service ──────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (params?: { type?: string; city?: string }) =>
    unwrap<{ vendors: any[] }>(api.get("/vendors", { params })),

  create: (data: any) =>
    unwrap<any>(api.post("/vendors", data)),

  approveKyc: (id: string) =>
    unwrap<any>(api.patch(`/vendors/${id}/kyc-approve`)),

  rate: (id: string, data: { bookingId: string; rating: number; comment?: string }) =>
    unwrap<any>(api.post(`/vendors/${id}/ratings`, data)),
};

// ── Ops Service ──────────────────────────────────────────────────────────────
export const opsApi = {
  getPendingBookings: (params?: { type?: string; city?: string }) =>
    unwrap<{ bookings: any[] }>(api.get("/ops/bookings/pending", { params })),

  claimBooking: (id: string) =>
    unwrap<any>(api.patch(`/ops/bookings/${id}/claim`)),

  confirmBooking: (id: string, referenceCode: string) =>
    unwrap<any>(api.patch(`/ops/bookings/${id}/confirm`, { referenceCode })),

  failBooking: (id: string, reason: string) =>
    unwrap<any>(api.patch(`/ops/bookings/${id}/fail`, { reason })),
};
