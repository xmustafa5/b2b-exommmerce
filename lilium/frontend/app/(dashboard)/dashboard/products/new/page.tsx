"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/actions/config";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  wholesalePrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
  minStock: z.coerce.number().int().min(0).optional(),
  unit: z.string().default("pcs"),
  categoryId: z.string().min(1, "Category is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const { data: categoriesData } = useCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: "pcs",
      stock: 0,
      minStock: 0,
    },
  });

  const categoryId = watch("categoryId");

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createMutation.mutateAsync(data);
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Failed to create product:", getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="New Product" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Create New Product</h2>
            <p className="text-sm text-muted-foreground">
              Add a new product to your catalog
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Product name and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter product name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameAr">Product Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    placeholder="أدخل اسم المنتج"
                    dir="rtl"
                    {...register("nameAr")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Enter product description"
                    {...register("description")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={categoryId}
                    onValueChange={(value) => setValue("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.data?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              </CardContent>
            </Card>

            {/* Pricing & Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
                <CardDescription>
                  Set prices and stock levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="PRD-001"
                      {...register("sku")}
                    />
                    {errors.sku && (
                      <p className="text-sm text-destructive">
                        {errors.sku.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="Optional"
                      {...register("barcode")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (IQD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      {...register("price")}
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                    <Input
                      id="wholesalePrice"
                      type="number"
                      placeholder="0"
                      {...register("wholesalePrice")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      placeholder="0"
                      {...register("costPrice")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={watch("unit")}
                      onValueChange={(value) => setValue("unit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="g">Gram</SelectItem>
                        <SelectItem value="l">Liter</SelectItem>
                        <SelectItem value="ml">Milliliter</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="minStock">Min Stock Alert</Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="0"
                      {...register("minStock")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
