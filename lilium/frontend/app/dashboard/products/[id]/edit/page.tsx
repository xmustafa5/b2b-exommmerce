"use client";

import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { useProduct, useUpdateProduct } from "@/app/hooks/useProducts";
import type { ProductUpdateInput } from "@/app/types/product";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading } = useProduct(productId);
  const updateMutation = useUpdateProduct(productId);

  const handleSubmit = async (data: ProductUpdateInput) => {
    await updateMutation.mutateAsync(data);
    router.push(`/dashboard/products/${productId}`);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">Update product information</p>
      </div>

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
