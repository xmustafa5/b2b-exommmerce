"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SingleImageUpload } from "@/components/ui/image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateCompany } from "@/hooks/useCompanies";
import { getErrorMessage } from "@/actions/config";
import type { Company, Zone } from "@/types/company";

const editCompanySchema = z.object({
  name: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  zones: z.array(z.enum(["KARKH", "RUSAFA"])).min(1, "At least one zone is required"),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDeliveryTime: z.coerce.number().min(0).optional(),
});

type EditCompanyFormData = z.infer<typeof editCompanySchema>;

interface CompanyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess?: () => void;
}

export function CompanyEditDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyEditDialogProps) {
  const updateMutation = useUpdateCompany(company.id);
  const [logo, setLogo] = useState<string | null>(company.logo || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditCompanyFormData>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      name: company.nameEn,
      nameAr: company.nameAr,
      description: company.description || "",
      email: company.email,
      phone: company.phone || "",
      address: company.address || "",
      logo: company.logo || "",
      zones: company.zones,
      commissionRate: company.commission,
    },
  });

  const zones = watch("zones");

  // Reset form when dialog opens or company changes
  useEffect(() => {
    if (open) {
      reset({
        name: company.nameEn,
        nameAr: company.nameAr,
        description: company.description || "",
        email: company.email,
        phone: company.phone || "",
        address: company.address || "",
        logo: company.logo || "",
        zones: company.zones,
        commissionRate: company.commission,
      });
      setLogo(company.logo || null);
    }
  }, [open, company, reset]);

  const onSubmit = async (data: EditCompanyFormData) => {
    try {
      const submitData = {
        ...data,
        logo: logo || undefined,
      };
      await updateMutation.mutateAsync(submitData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update company:", getErrorMessage(error));
    }
  };

  const toggleZone = (zone: Zone) => {
    const currentZones = zones || [];
    if (currentZones.includes(zone)) {
      setValue("zones", currentZones.filter((z) => z !== zone));
    } else {
      setValue("zones", [...currentZones, zone]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update the company details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Company Names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                placeholder="Enter company name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                placeholder="أدخل اسم الشركة"
                dir="rtl"
                {...register("nameAr")}
              />
              {errors.nameAr && (
                <p className="text-sm text-destructive">
                  {errors.nameAr.message}
                </p>
              )}
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description (English)</Label>
              <textarea
                id="description"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter company description"
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Description (Arabic)</Label>
              <textarea
                id="descriptionAr"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="أدخل وصف الشركة"
                dir="rtl"
                {...register("descriptionAr")}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="company@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+964 XXX XXX XXXX"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter company address"
              {...register("address")}
            />
          </div>

          {/* Company Logo */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <SingleImageUpload
              value={logo}
              onChange={setLogo}
              previewSize="lg"
            />
          </div>

          {/* Zones */}
          <div className="space-y-2">
            <Label>Zones *</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="zone-karkh"
                  checked={zones?.includes("KARKH")}
                  onCheckedChange={() => toggleZone("KARKH")}
                />
                <label
                  htmlFor="zone-karkh"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Karkh
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="zone-rusafa"
                  checked={zones?.includes("RUSAFA")}
                  onCheckedChange={() => toggleZone("RUSAFA")}
                />
                <label
                  htmlFor="zone-rusafa"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Rusafa
                </label>
              </div>
            </div>
            {errors.zones && (
              <p className="text-sm text-destructive">{errors.zones.message}</p>
            )}
          </div>

          {/* Business Settings */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="10"
                {...register("commissionRate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Min Order (IQD)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                min="0"
                placeholder="10000"
                {...register("minOrderAmount")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDeliveryTime">Max Delivery (min)</Label>
              <Input
                id="maxDeliveryTime"
                type="number"
                min="0"
                placeholder="120"
                {...register("maxDeliveryTime")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Company"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
