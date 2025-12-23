"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCancelPayout } from "@/hooks/usePayouts";
import { useToast } from "@/hooks/use-toast";
import type { Payout } from "@/types/payout";

interface PayoutCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: Payout;
}

export function PayoutCancelDialog({
  open,
  onOpenChange,
  payout,
}: PayoutCancelDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");

  const cancelMutation = useCancelPayout();

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: payout.id,
        reason,
      });
      toast({
        title: "Success",
        description: "Payout cancelled successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel payout",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Payout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this payout request for{" "}
              <strong>{formatCurrency(payout.amount)}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for cancellation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Keep Payout
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending || !reason.trim()}
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Payout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
