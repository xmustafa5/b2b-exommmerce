"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isAfter, isBefore } from "date-fns";
import { Edit, Trash2, CalendarDays, MapPin, Tag, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePromotion, useDeletePromotion } from "@/app/hooks/usePromotions";
import { useProducts } from "@/app/hooks/useProducts";
import { useCategories } from "@/app/hooks/useCategories";
import type { Promotion } from "@/app/types/promotion";

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: promotion, isLoading } = usePromotion(id);
  const { data: productsData } = useProducts();
  const { data: categoriesData } = useCategories();
  const deleteMutation = useDeletePromotion();

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!promotion) {
    return <div className="text-center py-12">Promotion not found</div>;
  }

  const getPromotionStatus = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive || isAfter(now, end)) {
      return { status: "expired", variant: "destructive" as const };
    } else if (isBefore(now, start)) {
      return { status: "upcoming", variant: "secondary" as const };
    } else {
      return { status: "active", variant: "default" as const };
    }
  };

  const status = getPromotionStatus(promotion);

  const appliedProducts =
    productsData?.data.filter((p) =>
      promotion.products.includes(p.id)
    ) || [];

  const appliedCategories =
    (categoriesData || []).filter((c) =>
      promotion.categories.includes(c.id)
    );

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push("/dashboard/promotions");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {promotion.nameEn}
            </h1>
            <Badge variant={status.variant}>{status.status}</Badge>
            {promotion.isActive ? (
              <Badge variant="outline">Enabled</Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{promotion.nameAr}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/promotions/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Description (English)
              </h3>
              <p className="mt-1">{promotion.descriptionEn}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Description (Arabic)
              </h3>
              <p className="mt-1" dir="rtl">
                {promotion.descriptionAr}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Type
                </h3>
                <p className="mt-1 font-medium">
                  {promotion.type === "percentage"
                    ? "Percentage Discount"
                    : "Fixed Amount Discount"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Value
                </h3>
                <p className="mt-1 font-medium text-lg">
                  {promotion.type === "percentage"
                    ? `${promotion.value}%`
                    : `$${promotion.value}`}
                </p>
              </div>
            </div>
            {promotion.minPurchase && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Minimum Purchase
                </h3>
                <p className="mt-1">${promotion.minPurchase}</p>
              </div>
            )}
            {promotion.maxDiscount && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Maximum Discount
                </h3>
                <p className="mt-1">${promotion.maxDiscount}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Period & Zones */}
        <Card>
          <CardHeader>
            <CardTitle>Period & Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Promotion Period
              </div>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="text-sm text-muted-foreground">Start:</span>{" "}
                  {format(new Date(promotion.startDate), "PPP")}
                </p>
                <p>
                  <span className="text-sm text-muted-foreground">End:</span>{" "}
                  {format(new Date(promotion.endDate), "PPP")}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                Delivery Zones
              </div>
              <div className="flex flex-wrap gap-2">
                {promotion.zones.map((zone) => (
                  <Badge key={zone} variant="secondary">
                    {zone.charAt(0).toUpperCase() + zone.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applied Products */}
        <Card>
          <CardHeader>
            <CardTitle>Applied Products</CardTitle>
            <CardDescription>
              {promotion.products.length === 0
                ? "Applied to all products"
                : `${promotion.products.length} product(s) selected`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appliedProducts.length > 0 ? (
              <div className="space-y-2">
                {appliedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-lg border"
                  >
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.nameAr}
                      </p>
                    </div>
                    <Badge variant="outline">${product.price}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-8 w-8 mb-2" />
                <p>Applied to all products</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applied Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Applied Categories</CardTitle>
            <CardDescription>
              {promotion.categories.length === 0
                ? "Applied to all categories"
                : `${promotion.categories.length} category(s) selected`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appliedCategories.length > 0 ? (
              <div className="space-y-2">
                {appliedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.nameAr}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="mx-auto h-8 w-8 mb-2" />
                <p>Applied to all categories</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Created At
            </h3>
            <p className="mt-1">
              {format(new Date(promotion.createdAt), "PPP")}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Updated At
            </h3>
            <p className="mt-1">
              {format(new Date(promotion.updatedAt), "PPP")}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Promotion ID
            </h3>
            <p className="mt-1 font-mono text-sm">{promotion.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              promotion "{promotion.nameEn}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
