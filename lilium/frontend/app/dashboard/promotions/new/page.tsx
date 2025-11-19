"use client";

import { PromotionForm } from "@/components/promotions/promotion-form";

export default function NewPromotionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Promotion</h1>
        <p className="text-muted-foreground">
          Create a new discount or special offer
        </p>
      </div>

      <div className="max-w-4xl">
        <PromotionForm mode="create" />
      </div>
    </div>
  );
}
