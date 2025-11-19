"use client";

import { useParams } from "next/navigation";
import { PromotionForm } from "@/components/promotions/promotion-form";
import { usePromotion } from "@/app/hooks/usePromotions";

export default function EditPromotionPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: promotion, isLoading } = usePromotion(id);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!promotion) {
    return <div className="text-center py-12">Promotion not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Promotion</h1>
        <p className="text-muted-foreground">
          Update promotion details and settings
        </p>
      </div>

      <div className="max-w-4xl">
        <PromotionForm promotion={promotion} mode="edit" />
      </div>
    </div>
  );
}
