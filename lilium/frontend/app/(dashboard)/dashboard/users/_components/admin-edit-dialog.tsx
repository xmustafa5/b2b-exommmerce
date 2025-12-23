"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useUpdateAdmin } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import type { Admin } from "@/types/user";

const ZONES = [
  { id: "KARKH" as const, label: "Karkh" },
  { id: "RUSAFA" as const, label: "Rusafa" },
];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  zones: z.array(z.enum(["KARKH", "RUSAFA"])).min(1, "Select at least one zone"),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface AdminEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
}

export function AdminEditDialog({
  open,
  onOpenChange,
  admin,
}: AdminEditDialogProps) {
  const { toast } = useToast();
  const updateAdmin = useUpdateAdmin(admin?.id || "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      zones: [],
      isActive: true,
    },
  });

  const selectedZones = watch("zones");
  const isActive = watch("isActive");

  // Reset form when dialog opens with admin data
  useEffect(() => {
    if (open && admin) {
      reset({
        name: admin.name,
        phone: admin.phone || "",
        zones: admin.zones as ("KARKH" | "RUSAFA")[],
        isActive: admin.isActive,
      });
    }
  }, [open, admin, reset]);

  const handleZoneToggle = (zoneId: "KARKH" | "RUSAFA", checked: boolean) => {
    const current = selectedZones || [];
    if (checked) {
      setValue("zones", [...current, zoneId]);
    } else {
      setValue("zones", current.filter((z) => z !== zoneId));
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!admin) return;

    try {
      await updateAdmin.mutateAsync({
        name: data.name,
        phone: data.phone || undefined,
        zones: data.zones,
        isActive: data.isActive,
      });
      toast({
        title: "Success",
        description: "Admin updated successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update admin",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>
            Update admin information and zone assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{admin?.email}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Role: <span className="font-medium text-foreground">{admin?.role}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              placeholder="+964 XXX XXX XXXX"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label>Zones *</Label>
            <div className="flex gap-4">
              {ZONES.map((zone) => (
                <div key={zone.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-zone-${zone.id}`}
                    checked={selectedZones?.includes(zone.id)}
                    onCheckedChange={(checked) =>
                      handleZoneToggle(zone.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`edit-zone-${zone.id}`}
                    className="font-normal cursor-pointer"
                  >
                    {zone.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.zones && (
              <p className="text-sm text-destructive">{errors.zones.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-base">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this admin account
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
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
            <Button type="submit" disabled={updateAdmin.isPending}>
              {updateAdmin.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
