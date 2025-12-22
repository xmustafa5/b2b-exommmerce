"use client";

import { useState } from "react";
import { format } from "date-fns";
import { History, Package, RefreshCw, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStockHistory } from "@/hooks/useInventory";
import type { StockUpdateType } from "@/types/inventory";

interface StockHistoryTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

const getTypeIcon = (type: StockUpdateType) => {
  switch (type) {
    case "RESTOCK":
      return <Package className="h-4 w-4" />;
    case "ADJUSTMENT":
      return <Settings className="h-4 w-4" />;
    case "RETURN":
      return <RefreshCw className="h-4 w-4" />;
  }
};

const getTypeBadge = (type: StockUpdateType) => {
  switch (type) {
    case "RESTOCK":
      return <Badge variant="default">Restock</Badge>;
    case "ADJUSTMENT":
      return <Badge variant="secondary">Adjustment</Badge>;
    case "RETURN":
      return <Badge variant="outline">Return</Badge>;
  }
};

export function StockHistoryTable({
  open,
  onOpenChange,
  productId,
  productName,
}: StockHistoryTableProps) {
  const { data, isLoading } = useStockHistory(productId, { limit: 50 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Stock History
          </DialogTitle>
          <DialogDescription>
            Stock change history for &quot;{productName}&quot;
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !data?.history.length ? (
          <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <History className="mb-4 h-12 w-12" />
            <p>No stock history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {data.history.length} of {data.total} records
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead>Updated By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((record) => {
                  const change = record.newStock - record.previousStock;
                  const isPositive = change > 0;

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{getTypeBadge(record.type)}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            isPositive ? "text-green-600" : "text-destructive"
                          }
                        >
                          {isPositive ? "+" : ""}
                          {change}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {record.previousStock}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {record.newStock}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.user?.name || "Unknown"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {data.history.some((r) => r.notes) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Notes</p>
                {data.history
                  .filter((r) => r.notes)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="rounded-md bg-muted p-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {format(new Date(record.createdAt), "MMM d, HH:mm")}:{" "}
                      </span>
                      {record.notes}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
