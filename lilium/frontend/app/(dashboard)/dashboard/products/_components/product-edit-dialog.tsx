"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCompanies } from "@/hooks/useCompanies";
import { getErrorMessage } from "@/actions/config";
import type { Product, Zone } from "@/types/product";

const editProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compareAtPrice: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
  minOrderQty: z.coerce.number().int().min(1).optional(),
  unit: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  companyId: z.string().min(1, "Company is required"),
  zones: z.array(z.enum(["KARKH", "RUSAFA"])).min(1, "At least one zone is required"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSuccess?: () => void;
}

export function ProductEditDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductEditDialogProps) {
  const updateMutation = useUpdateProduct(product.id);
  const { data: categories } = useCategories();
  const { data: companiesData } = useCompanies();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      sku: product.sku,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      descriptionEn: product.descriptionEn || "",
      descriptionAr: product.descriptionAr || "",
      price: product.price,
      compareAtPrice: product.compareAtPrice || 0,
      cost: product.cost || 0,
      stock: product.stock,
      minOrderQty: product.minOrderQty,
      unit: product.unit,
      categoryId: product.categoryId,
      companyId: product.companyId,
      zones: product.zones,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    },
  });

  const categoryId = watch("categoryId");
  const zones = watch("zones");
  const isActive = watch("isActive");
  const isFeatured = watch("isFeatured");

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open) {
      reset({
        sku: product.sku,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn || "",
        descriptionAr: product.descriptionAr || "",
        price: product.price,
        compareAtPrice: product.compareAtPrice || 0,
        cost: product.cost || 0,
        stock: product.stock,
        minOrderQty: product.minOrderQty,
        unit: product.unit,
        categoryId: product.categoryId,
        companyId: product.companyId,
        zones: product.zones,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (data: EditProductFormData) => {
    try {
      const submitData = {
        ...data,
        compareAtPrice: data.compareAtPrice || undefined,
        cost: data.cost || undefined,
        descriptionEn: data.descriptionEn || undefined,
        descriptionAr: data.descriptionAr || undefined,
      };

      await updateMutation.mutateAsync(submitData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update product:", getErrorMessage(error));
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
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              placeholder="Enter product SKU"
              {...register("sku")}
            />
            {errors.sku && (
              <p className="text-sm text-destructive">{errors.sku.message}</p>
            )}
          </div>

          {/* Product Names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameEn">Name (English) *</Label>
              <Input
                id="nameEn"
                placeholder="Enter product name"
                {...register("nameEn")}
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">
                  {errors.nameEn.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">Name (Arabic) *</Label>
              <Input
                id="nameAr"
                placeholder="أدخل اسم المنتج"
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
              <Label htmlFor="descriptionEn">Description (English)</Label>
              <textarea
                id="descriptionEn"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter product description"
                {...register("descriptionEn")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Description (Arabic)</Label>
              <textarea
                id="descriptionAr"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="أدخل وصف المنتج"
                dir="rtl"
                {...register("descriptionAr")}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (IQD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare At Price</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("compareAtPrice")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("cost")}
              />
            </div>
          </div>

          {/* Stock and Order */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                {...register("stock")}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">
                  {errors.stock.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderQty">Min Order Qty</Label>
              <Input
                id="minOrderQty"
                type="number"
                placeholder="1"
                {...register("minOrderQty")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder="piece"
                {...register("unit")}
              />
            </div>
          </div>

          {/* Category and Company */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select
                value={categoryId || ""}
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyId">Company *</Label>
              <Select
                value={watch("companyId") || ""}
                onValueChange={(value) => setValue("companyId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesData?.companies.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyId && (
                <p className="text-sm text-destructive">
                  {errors.companyId.message}
                </p>
              )}
            </div>
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

          {/* Status Toggles */}
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked as boolean)
                }
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) =>
                  setValue("isFeatured", checked as boolean)
                }
              />
              <label
                htmlFor="isFeatured"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Featured
              </label>
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
                "Update Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
