"use client";

import { Loader2 } from "lucide-react";
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
import { useDeletePromotion } from "@/hooks/usePromotions";
import type { Promotion } from "@/types/promotion";

interface PromotionDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion;
  onSuccess?: () => void;
}

export function PromotionDeleteDialog({
  open,
  onOpenChange,
  promotion,
  onSuccess,
}: PromotionDeleteDialogProps) {
  const deleteMutation = useDeletePromotion();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(promotion.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete promotion:", error);
    }
  };

  const hasUsage = promotion.usageCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the promotion &quot;{promotion.name}&quot;
            (code: {promotion.code})?
            {hasUsage && (
              <span className="mt-2 block text-amber-600">
                This promotion has been used {promotion.usageCount} time(s).
              </span>
            )}
            <span className="mt-2 block">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
