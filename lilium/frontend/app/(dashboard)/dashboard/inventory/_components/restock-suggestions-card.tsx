"use client";

import { AlertTriangle, TrendingDown, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRestockSuggestions } from "@/hooks/useInventory";
import type { RestockSuggestion, LowStockProduct } from "@/types/inventory";

interface RestockSuggestionsCardProps {
  onUpdateStock?: (product: LowStockProduct) => void;
}

export function RestockSuggestionsCard({ onUpdateStock }: RestockSuggestionsCardProps) {
  const { data: suggestions, isLoading } = useRestockSuggestions(30);

  const getUrgencyBadge = (daysUntilOutOfStock: number) => {
    if (daysUntilOutOfStock <= 3) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (daysUntilOutOfStock <= 7) {
      return <Badge variant="default" className="bg-amber-500">Urgent</Badge>;
    }
    if (daysUntilOutOfStock <= 14) {
      return <Badge variant="secondary">Soon</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Restock Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Restock Suggestions
          </CardTitle>
          <CardDescription>
            Based on 30-day sales velocity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
            <Package className="mb-2 h-8 w-8" />
            <p>All products have adequate stock levels</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by urgency (days until out of stock)
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => a.daysUntilOutOfStock - b.daysUntilOutOfStock
  );

  // Take top 10 most urgent
  const topSuggestions = sortedSuggestions.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Restock Suggestions
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {suggestions.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Products that need restocking based on 30-day sales velocity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Daily Sales</TableHead>
              <TableHead className="text-right">Days Left</TableHead>
              <TableHead className="text-right">Suggested Order</TableHead>
              <TableHead>Urgency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topSuggestions.map((suggestion) => (
              <TableRow key={suggestion.product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{suggestion.product.nameEn}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {suggestion.product.sku}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {suggestion.currentStock}
                </TableCell>
                <TableCell className="text-right">
                  {suggestion.dailyVelocity.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      suggestion.daysUntilOutOfStock <= 7
                        ? "text-destructive font-medium"
                        : ""
                    }
                  >
                    {Math.round(suggestion.daysUntilOutOfStock)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {suggestion.suggestedReorder}
                </TableCell>
                <TableCell>
                  {getUrgencyBadge(suggestion.daysUntilOutOfStock)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {suggestions.length > 10 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Showing top 10 of {suggestions.length} products needing restock
          </p>
        )}
      </CardContent>
    </Card>
  );
}
