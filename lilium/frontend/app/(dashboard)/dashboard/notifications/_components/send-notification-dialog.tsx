"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, User, MapPin, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSendToUser,
  useSendToAdmins,
  useSendToZone,
} from "@/hooks/useNotifications";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";

const baseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message body is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const userSchema = baseSchema.extend({
  userId: z.string().min(1, "Select a user"),
});

const zoneSchema = baseSchema.extend({
  zone: z.enum(["KARKH", "RUSAFA"]),
});

type BaseFormData = z.infer<typeof baseSchema>;
type UserFormData = z.infer<typeof userSchema>;
type ZoneFormData = z.infer<typeof zoneSchema>;

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNotificationDialog({
  open,
  onOpenChange,
}: SendNotificationDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"user" | "zone" | "admins">("user");

  const { data: usersData } = useUsers();
  const sendToUser = useSendToUser();
  const sendToAdmins = useSendToAdmins();
  const sendToZone = useSendToZone();

  // User form
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      userId: "",
      title: "",
      body: "",
      imageUrl: "",
    },
  });

  // Zone form
  const zoneForm = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      zone: "KARKH",
      title: "",
      body: "",
      imageUrl: "",
    },
  });

  // Admins form
  const adminsForm = useForm<BaseFormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      title: "",
      body: "",
      imageUrl: "",
    },
  });

  // Reset forms when dialog opens
  useEffect(() => {
    if (open) {
      userForm.reset();
      zoneForm.reset();
      adminsForm.reset();
      setActiveTab("user");
    }
  }, [open, userForm, zoneForm, adminsForm]);

  const handleSendToUser = async (data: UserFormData) => {
    try {
      const result = await sendToUser.mutateAsync({
        userId: data.userId,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl || undefined,
      });
      toast({
        title: result.success ? "Success" : "Warning",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const handleSendToZone = async (data: ZoneFormData) => {
    try {
      const result = await sendToZone.mutateAsync({
        zone: data.zone,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl || undefined,
      });
      toast({
        title: "Success",
        description: result.message,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const handleSendToAdmins = async (data: BaseFormData) => {
    try {
      const result = await sendToAdmins.mutateAsync({
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl || undefined,
      });
      toast({
        title: "Success",
        description: result.message,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const isPending =
    sendToUser.isPending || sendToZone.isPending || sendToAdmins.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send push notifications to users, zones, or all admins.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              User
            </TabsTrigger>
            <TabsTrigger value="zone" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zone
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Admins
            </TabsTrigger>
          </TabsList>

          {/* Send to User */}
          <TabsContent value="user">
            <form
              onSubmit={userForm.handleSubmit(handleSendToUser)}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="userId">Select User *</Label>
                <Select
                  value={userForm.watch("userId")}
                  onValueChange={(value) => userForm.setValue("userId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersData?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userForm.formState.errors.userId && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.userId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  {...userForm.register("title")}
                />
                {userForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Notification message"
                  rows={3}
                  {...userForm.register("body")}
                />
                {userForm.formState.errors.body && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.body.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.png"
                  {...userForm.register("imageUrl")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {sendToUser.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send to User
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Send to Zone */}
          <TabsContent value="zone">
            <form
              onSubmit={zoneForm.handleSubmit(handleSendToZone)}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="zone">Select Zone *</Label>
                <Select
                  value={zoneForm.watch("zone")}
                  onValueChange={(value) =>
                    zoneForm.setValue("zone", value as "KARKH" | "RUSAFA")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KARKH">Karkh (Western Baghdad)</SelectItem>
                    <SelectItem value="RUSAFA">Rusafa (Eastern Baghdad)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-title">Title *</Label>
                <Input
                  id="zone-title"
                  placeholder="Notification title"
                  {...zoneForm.register("title")}
                />
                {zoneForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {zoneForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-body">Message *</Label>
                <Textarea
                  id="zone-body"
                  placeholder="Notification message"
                  rows={3}
                  {...zoneForm.register("body")}
                />
                {zoneForm.formState.errors.body && (
                  <p className="text-sm text-destructive">
                    {zoneForm.formState.errors.body.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone-imageUrl">Image URL (Optional)</Label>
                <Input
                  id="zone-imageUrl"
                  placeholder="https://example.com/image.png"
                  {...zoneForm.register("imageUrl")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {sendToZone.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send to Zone
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Send to Admins */}
          <TabsContent value="admins">
            <form
              onSubmit={adminsForm.handleSubmit(handleSendToAdmins)}
              className="space-y-4 mt-4"
            >
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  This will send a notification to all administrators (Super
                  Admins and Location Admins).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admins-title">Title *</Label>
                <Input
                  id="admins-title"
                  placeholder="Notification title"
                  {...adminsForm.register("title")}
                />
                {adminsForm.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {adminsForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admins-body">Message *</Label>
                <Textarea
                  id="admins-body"
                  placeholder="Notification message"
                  rows={3}
                  {...adminsForm.register("body")}
                />
                {adminsForm.formState.errors.body && (
                  <p className="text-sm text-destructive">
                    {adminsForm.formState.errors.body.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admins-imageUrl">Image URL (Optional)</Label>
                <Input
                  id="admins-imageUrl"
                  placeholder="https://example.com/image.png"
                  {...adminsForm.register("imageUrl")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {sendToAdmins.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send to Admins
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
