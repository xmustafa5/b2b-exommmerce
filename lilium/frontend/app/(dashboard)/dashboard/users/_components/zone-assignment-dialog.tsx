"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useUpdateAdminZones } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import type { Admin, Zone } from "@/types/user";

const ZONES = [
  { id: "KARKH" as const, label: "Karkh", description: "Western Baghdad" },
  { id: "RUSAFA" as const, label: "Rusafa", description: "Eastern Baghdad" },
];

const formSchema = z.object({
  zones: z.array(z.enum(["KARKH", "RUSAFA"])).min(1, "Select at least one zone"),
});

type FormData = z.infer<typeof formSchema>;

interface ZoneAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
}

export function ZoneAssignmentDialog({
  open,
  onOpenChange,
  admin,
}: ZoneAssignmentDialogProps) {
  const { toast } = useToast();
  const updateZones = useUpdateAdminZones(admin?.id || "");

  const {
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      zones: [],
    },
  });

  const selectedZones = watch("zones");

  // Reset form when dialog opens with admin data
  useEffect(() => {
    if (open && admin) {
      reset({
        zones: admin.zones as ("KARKH" | "RUSAFA")[],
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
      await updateZones.mutateAsync(data.zones as Zone[]);
      toast({
        title: "Success",
        description: "Zone assignments updated successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to update zone assignments",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Assign Zones
          </DialogTitle>
          <DialogDescription>
            Select which zones this admin can manage.
          </DialogDescription>
        </DialogHeader>

        {admin && (
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="font-medium">{admin.name}</p>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Available Zones</Label>
            <div className="space-y-3">
              {ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`assign-zone-${zone.id}`}
                    checked={selectedZones?.includes(zone.id)}
                    onCheckedChange={(checked) =>
                      handleZoneToggle(zone.id, checked === true)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor={`assign-zone-${zone.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {zone.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {zone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {errors.zones && (
              <p className="text-sm text-destructive">{errors.zones.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateZones.isPending}>
              {updateZones.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Zones
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
