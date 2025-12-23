"use client";

import { useEffect, useState } from "react";
import { Loader2, Banknote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMarkCashCollected } from "@/hooks/useSettlements";
import { useToast } from "@/hooks/use-toast";
import type { PendingCashCollection } from "@/types/settlement";

interface CashCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: PendingCashCollection;
}

export function CashCollectionDialog({
  open,
  onOpenChange,
  collection,
}: CashCollectionDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const markMutation = useMarkCashCollected();

  useEffect(() => {
    if (open) {
      setAmount(String(collection.orderAmount));
    }
  }, [open, collection.orderAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await markMutation.mutateAsync({
        orderId: collection.orderId,
        amount: numAmount,
      });
      toast({
        title: "Success",
        description: "Cash collection marked successfully",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark cash collection",
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
              <Banknote className="h-5 w-5 text-green-500" />
              Mark Cash Collected
            </DialogTitle>
            <DialogDescription>
              Record cash collection for order{" "}
              <strong>{collection.orderNumber}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-medium">{collection.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{collection.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Amount:</span>
                <span className="font-medium">
                  {formatCurrency(collection.orderAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Collected Amount (IQD) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter collected amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                step={1}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the actual amount collected. May differ from order amount.
              </p>
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
            <Button type="submit" disabled={markMutation.isPending}>
              {markMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Mark Collected
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
