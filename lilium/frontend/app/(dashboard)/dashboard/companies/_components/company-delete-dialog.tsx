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
import { useDeleteCompany } from "@/hooks/useCompanies";
import type { Company } from "@/types/company";

interface CompanyDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess?: () => void;
}

export function CompanyDeleteDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyDeleteDialogProps) {
  const deleteMutation = useDeleteCompany();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(company.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  };

  const hasProducts = company._count?.products && company._count.products > 0;
  const hasUsers = company._count?.users && company._count.users > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Company</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{company.nameEn}&quot;?
            {hasProducts && (
              <span className="mt-2 block text-destructive">
                This company has {company._count?.products} product(s).
              </span>
            )}
            {hasUsers && (
              <span className="mt-2 block text-destructive">
                This company has {company._count?.users} user(s)/vendor(s).
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
