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
import { useCreateAdmin } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";

const ZONES = [
  { id: "KARKH" as const, label: "Karkh" },
  { id: "RUSAFA" as const, label: "Rusafa" },
];

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  zones: z.array(z.enum(["KARKH", "RUSAFA"])).min(1, "Select at least one zone"),
});

type FormData = z.infer<typeof formSchema>;

interface AdminCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCreateDialog({
  open,
  onOpenChange,
}: AdminCreateDialogProps) {
  const { toast } = useToast();
  const createAdmin = useCreateAdmin();

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
      email: "",
      password: "",
      name: "",
      phone: "",
      zones: [],
    },
  });

  const selectedZones = watch("zones");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        email: "",
        password: "",
        name: "",
        phone: "",
        zones: [],
      });
    }
  }, [open, reset]);

  const handleZoneToggle = (zoneId: "KARKH" | "RUSAFA", checked: boolean) => {
    const current = selectedZones || [];
    if (checked) {
      setValue("zones", [...current, zoneId]);
    } else {
      setValue("zones", current.filter((z) => z !== zoneId));
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createAdmin.mutateAsync({
        ...data,
        role: "LOCATION_ADMIN",
        zones: data.zones,
      });
      toast({
        title: "Success",
        description: "Admin created successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create admin",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Location Admin</DialogTitle>
          <DialogDescription>
            Add a new location admin to manage specific zones.
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

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
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
                    id={`zone-${zone.id}`}
                    checked={selectedZones?.includes(zone.id)}
                    onCheckedChange={(checked) =>
                      handleZoneToggle(zone.id, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`zone-${zone.id}`}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createAdmin.isPending}>
              {createAdmin.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
