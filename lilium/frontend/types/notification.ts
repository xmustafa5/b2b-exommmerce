// Notification types aligned with backend API

export type Zone = "KARKH" | "RUSAFA";

// Base notification payload
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

// Send to specific user
export interface SendToUserInput extends NotificationPayload {
  userId: string;
}

// Send to zone
export interface SendToZoneInput extends NotificationPayload {
  zone: Zone;
}

// Notification status response
export interface NotificationStatus {
  firebaseInitialized: boolean;
  tokenRegistered: boolean;
}

// Send notification response
export interface SendNotificationResponse {
  success?: boolean;
  message: string;
}

// Notification history item (if stored in DB)
export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  type: "USER" | "ZONE" | "ADMINS" | "BROADCAST";
  targetId?: string;
  targetZone?: Zone;
  sentBy: string;
  sentAt: string;
  successCount?: number;
  failureCount?: number;
}

// User for recipient selection
export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
  zones?: Zone[];
  hasFcmToken: boolean;
}
