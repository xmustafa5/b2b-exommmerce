"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";
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
import { useUpdateVendorProduct } from "@/hooks/useVendors";
import { useCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/actions/config";
import type { VendorProduct } from "@/types/vendor";

const editProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface VendorProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: VendorProduct;
}

export function VendorProductEditDialog({
  open,
  onOpenChange,
  product,
}: VendorProductEditDialogProps) {
  const updateMutation = useUpdateVendorProduct(product.id);
  const { data: categories } = useCategories();
  const [images, setImages] = useState<string[]>(product.images || []);

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
      stock: product.stock,
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    },
  });

  const categoryId = watch("categoryId");
  const isActive = watch("isActive");
  const isFeatured = watch("isFeatured");

  useEffect(() => {
    if (open) {
      reset({
        sku: product.sku,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn || "",
        descriptionAr: product.descriptionAr || "",
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
      setImages(product.images || []);
    }
  }, [open, product, reset]);

  const onSubmit = async (data: EditProductFormData) => {
    try {
      const submitData = {
        ...data,
        images: images,
      };
      await updateMutation.mutateAsync(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update product:", getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details for {product.nameEn}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" {...register("sku")} />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select value={categoryId} onValueChange={(value) => setValue("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">English Name *</Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">Arabic Name *</Label>
              <Input id="nameAr" {...register("nameAr")} dir="rtl" />
              {errors.nameAr && (
                <p className="text-sm text-destructive">{errors.nameAr.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">English Description</Label>
              <Textarea id="descriptionEn" {...register("descriptionEn")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr">Arabic Description</Label>
              <Textarea id="descriptionAr" {...register("descriptionAr")} dir="rtl" />
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <ImageUpload
              value={images}
              onChange={(value) => setImages((value as string[]) || [])}
              multiple
              maxFiles={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (IQD) *</Label>
              <Input type="number" id="price" {...register("price")} />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input type="number" id="stock" {...register("stock")} />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", !!checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={(checked) => setValue("isFeatured", !!checked)}
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">
                Featured
              </Label>
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
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
