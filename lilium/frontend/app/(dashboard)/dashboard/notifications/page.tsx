"use client";

import { useState } from "react";
import {
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Loader2,
  TestTube,
  Info,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  useNotificationStatus,
  useSendTestNotification,
} from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { SendNotificationDialog } from "./_components/send-notification-dialog";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const { data: status, isLoading: isLoadingStatus } = useNotificationStatus();
  const sendTest = useSendTestNotification();

  const handleSendTest = async () => {
    try {
      const result = await sendTest.mutateAsync();
      toast({
        title: result.success ? "Success" : "Warning",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <Header title="Notifications" />

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoadingStatus ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Firebase Status
                </CardTitle>
                {status?.firebaseInitialized ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {status?.firebaseInitialized ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-semibold text-green-600">
                        Connected
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-lg font-semibold text-red-600">
                        Not Initialized
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Firebase Cloud Messaging service
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Device Token
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {status?.tokenRegistered ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-lg font-semibold text-green-600">
                        Registered
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-yellow-500" />
                      <span className="text-lg font-semibold text-yellow-600">
                        Not Registered
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  FCM token for push notifications
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Push Notifications</AlertTitle>
        <AlertDescription>
          Push notifications are sent via Firebase Cloud Messaging (FCM). Users
          need to have the mobile app installed and have granted notification
          permissions to receive push notifications.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Send push notifications to users, zones, or broadcast to all admins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Send Notification */}
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Send Notification</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Send to users, zones, or admins
                </p>
                <Button onClick={() => setSendDialogOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </CardContent>
            </Card>

            {/* Test Notification */}
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                  <TestTube className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold">Test Notification</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Send a test notification to yourself
                </p>
                <Button
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sendTest.isPending || !status?.tokenRegistered}
                >
                  {sendTest.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Send Test
                </Button>
                {!status?.tokenRegistered && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Register your device first
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notification Types Info */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Notification Types</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">User</Badge>
                    <span className="text-sm text-muted-foreground">
                      Send to specific user
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Zone</Badge>
                    <span className="text-sm text-muted-foreground">
                      Send to all in zone
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Admins</Badge>
                    <span className="text-sm text-muted-foreground">
                      Broadcast to admins
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>User notifications:</strong> Send to a specific user by
              selecting them from the list.
            </li>
            <li>
              <strong>Zone notifications:</strong> Broadcast to all users in
              Karkh or Rusafa zones.
            </li>
            <li>
              <strong>Admin notifications:</strong> Send important updates to
              all Super Admins and Location Admins.
            </li>
            <li>
              <strong>Image support:</strong> Add an image URL to include a
              picture in the notification.
            </li>
            <li>
              <strong>Token required:</strong> Users must have registered their
              device token to receive notifications.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Send Notification Dialog */}
      <SendNotificationDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
      />
    </div>
  );
}
