import { useQuery, useMutation } from "@tanstack/react-query";
import { notificationsQueryKeys } from "@/constants/queryKeys";
import { notificationsApi } from "@/actions/notifications";
import type {
  NotificationPayload,
  SendToUserInput,
  SendToZoneInput,
} from "@/types/notification";

// Get notification status
export function useNotificationStatus() {
  return useQuery({
    queryKey: notificationsQueryKeys.status(),
    queryFn: notificationsApi.getStatus,
  });
}

// Register FCM token
export function useRegisterToken() {
  return useMutation({
    mutationFn: notificationsApi.registerToken,
  });
}

// Unregister FCM token
export function useUnregisterToken() {
  return useMutation({
    mutationFn: notificationsApi.unregisterToken,
  });
}

// Send notification to specific user
export function useSendToUser() {
  return useMutation({
    mutationFn: (input: SendToUserInput) => notificationsApi.sendToUser(input),
  });
}

// Send notification to all admins
export function useSendToAdmins() {
  return useMutation({
    mutationFn: (input: NotificationPayload) =>
      notificationsApi.sendToAdmins(input),
  });
}

// Send notification to zone
export function useSendToZone() {
  return useMutation({
    mutationFn: (input: SendToZoneInput) => notificationsApi.sendToZone(input),
  });
}

// Send test notification
export function useSendTestNotification() {
  return useMutation({
    mutationFn: notificationsApi.sendTest,
  });
}
