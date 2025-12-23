"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteAdmin } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import type { Admin } from "@/types/user";

interface AdminDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
}

export function AdminDeleteDialog({
  open,
  onOpenChange,
  admin,
}: AdminDeleteDialogProps) {
  const { toast } = useToast();
  const deleteAdmin = useDeleteAdmin();

  const handleDelete = async () => {
    if (!admin) return;

    try {
      await deleteAdmin.mutateAsync(admin.id);
      toast({
        title: "Success",
        description: "Admin deactivated successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to deactivate admin",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Deactivate Admin</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                This will deactivate the admin account. They will no longer be
                able to log in.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {admin && (
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="font-medium">{admin.name}</p>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Role: {admin.role} | Zones: {admin.zones.join(", ")}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAdmin.isPending}
          >
            {deleteAdmin.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Deactivate Admin
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
