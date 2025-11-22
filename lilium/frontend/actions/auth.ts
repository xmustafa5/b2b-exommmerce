import { apiClient } from "./config";
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  User,
} from "@/types/auth";

export const authApi = {
  // Dashboard login (VENDOR, COMPANY_MANAGER, ADMIN, SUPER_ADMIN)
  loginDashboard: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login/dashboard",
      data
    );
    return response.data;
  },

  // Mobile login (SHOP_OWNER, LOCATION_ADMIN)
  loginMobile: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login/mobile",
      data
    );
    return response.data;
  },

  // Internal login (SUPER_ADMIN only)
  loginInternal: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/internal/login",
      data
    );
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  // Request password reset
  requestPasswordReset: async (data: PasswordResetRequest): Promise<void> => {
    await apiClient.post("/auth/password/reset-request", data);
  },

  // Confirm password reset
  confirmPasswordReset: async (
    token: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.post("/auth/password/reset", { token, newPassword });
  },

  // Change password (authenticated)
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.post("/auth/password/change", {
      currentPassword,
      newPassword,
    });
  },

  // Refresh token
  refreshToken: async (
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post("/auth/refresh", { refreshToken });
    return response.data.tokens;
  },
};
