"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { useProduct, useDeleteProduct } from "@/app/hooks/useProducts";
import { useState } from "react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: product, isLoading } = useProduct(productId);
  const deleteMutation = useDeleteProduct();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(productId);
    router.push("/dashboard/products");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">{product.nameAr}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/products/${productId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {product.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square overflow-hidden rounded-lg border"
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No images available</p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">English</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Arabic</h3>
                <p className="text-sm text-gray-600" dir="rtl">
                  {product.descriptionAr}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                {product.sku && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="text-sm">{product.sku}</dd>
                  </>
                )}
                {product.barcode && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                    <dd className="text-sm">{product.barcode}</dd>
                  </>
                )}
                {product.weight && (
                  <>
                    <dt className="text-sm font-medium text-gray-500">Weight</dt>
                    <dd className="text-sm">{product.weight} kg</dd>
                  </>
                )}
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm">
                  {new Date(product.createdAt).toLocaleDateString()}
                </dd>
                <dt className="text-sm font-medium text-gray-500">Updated</dt>
                <dd className="text-sm">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active</span>
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Featured</span>
                <Badge variant={product.isFeatured ? "default" : "secondary"}>
                  {product.isFeatured ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Price</dt>
                  <dd className="text-sm font-medium">${product.price.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Stock</dt>
                  <dd className="text-sm font-medium">
                    <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                      {product.stock} units
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Min Order Qty</dt>
                  <dd className="text-sm font-medium">{product.minOrderQty}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{product.category?.name || "N/A"}</Badge>
            </CardContent>
          </Card>

          {/* Delivery Zones */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.zones.map((zone) => (
                  <Badge key={zone} variant="secondary">
                    {zone}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
