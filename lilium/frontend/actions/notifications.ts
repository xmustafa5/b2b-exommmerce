import { apiClient } from "./config";
import type {
  NotificationPayload,
  SendToUserInput,
  SendToZoneInput,
  NotificationStatus,
  SendNotificationResponse,
} from "@/types/notification";

export const notificationsApi = {
  // Get notification status for current user
  getStatus: async (): Promise<NotificationStatus> => {
    const { data } = await apiClient.get("/notifications/status");
    return data;
  },

  // Register FCM token
  registerToken: async (fcmToken: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/notifications/register-token", {
      fcmToken,
    });
    return data;
  },

  // Unregister FCM token (on logout)
  unregisterToken: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.delete("/notifications/unregister-token");
    return data;
  },

  // Send notification to specific user (Super Admin only)
  sendToUser: async (
    input: SendToUserInput
  ): Promise<SendNotificationResponse> => {
    const { data } = await apiClient.post("/notifications/send-to-user", input);
    return data;
  },

  // Send notification to all admins (Super Admin only)
  sendToAdmins: async (
    input: NotificationPayload
  ): Promise<SendNotificationResponse> => {
    const { data } = await apiClient.post("/notifications/send-to-admins", input);
    return data;
  },

  // Send notification to all users in a zone
  sendToZone: async (
    input: SendToZoneInput
  ): Promise<SendNotificationResponse> => {
    const { data } = await apiClient.post("/notifications/send-to-zone", input);
    return data;
  },

  // Send test notification to self
  sendTest: async (): Promise<SendNotificationResponse> => {
    const { data } = await apiClient.post("/notifications/test");
    return data;
  },
};
