"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
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
import { useVerifySettlement } from "@/hooks/useSettlements";
import { useToast } from "@/hooks/use-toast";
import type { Settlement } from "@/types/settlement";

interface VerifySettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement;
}

export function VerifySettlementDialog({
  open,
  onOpenChange,
  settlement,
}: VerifySettlementDialogProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const verifyMutation = useVerifySettlement();

  useEffect(() => {
    if (open) {
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyMutation.mutateAsync({
        settlementId: settlement.id,
        notes: notes || undefined,
      });
      toast({
        title: "Success",
        description: "Settlement verified successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to verify settlement",
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
              <CheckCircle className="h-5 w-5 text-green-500" />
              Verify Settlement
            </DialogTitle>
            <DialogDescription>
              Verify and approve this settlement for{" "}
              <strong>{formatCurrency(settlement.netAmount)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales:</span>
                <span className="font-medium">{formatCurrency(settlement.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee:</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(settlement.platformFee)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Net Amount:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(settlement.netAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add verification notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify Settlement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
