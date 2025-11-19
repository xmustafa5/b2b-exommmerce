"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { useCreateProduct } from "@/app/hooks/useProducts";
import type { ProductCreateInput } from "@/app/types/product";

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();

  const handleSubmit = async (data: ProductCreateInput) => {
    await createMutation.mutateAsync(data);
    router.push("/dashboard/products");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new product for your store
        </p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
