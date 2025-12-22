"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
  Gift,
  Package,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePromotions, useTogglePromotion } from "@/hooks/usePromotions";
import type { Promotion, PromotionFilters, PromotionType } from "@/types/promotion";
import { PromotionCreateDialog } from "./_components/promotion-create-dialog";
import { PromotionEditDialog } from "./_components/promotion-edit-dialog";
import { PromotionDeleteDialog } from "./_components/promotion-delete-dialog";
import { format } from "date-fns";

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "Percentage",
  fixed: "Fixed",
  buy_x_get_y: "Buy X Get Y",
  bundle: "Bundle",
};

const getPromotionTypeIcon = (type: PromotionType) => {
  switch (type) {
    case "percentage":
      return <Percent className="h-4 w-4" />;
    case "fixed":
      return <DollarSign className="h-4 w-4" />;
    case "buy_x_get_y":
      return <Gift className="h-4 w-4" />;
    case "bundle":
      return <Package className="h-4 w-4" />;
  }
};

const getPromotionValue = (promotion: Promotion) => {
  switch (promotion.type) {
    case "percentage":
      return `${promotion.value}%`;
    case "fixed":
      return `$${promotion.value.toFixed(2)}`;
    case "buy_x_get_y":
      return `Buy ${promotion.buyQuantity} Get ${promotion.getQuantity}`;
    case "bundle":
      return `$${promotion.bundlePrice?.toFixed(2) || "0.00"}`;
  }
};

const isPromotionExpired = (endDate: string) => {
  return new Date(endDate) < new Date();
};

const isPromotionUpcoming = (startDate: string) => {
  return new Date(startDate) > new Date();
};

export default function PromotionsPage() {
  const [filters, setFilters] = useState<PromotionFilters>({});
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);

  const { data: promotions, isLoading } = usePromotions(filters);
  const toggleMutation = useTogglePromotion();

  // Filter promotions by search term
  const filteredPromotions = useMemo(() => {
    if (!promotions) return [];
    if (!search) return promotions;

    const searchLower = search.toLowerCase();
    return promotions.filter(
      (promo) =>
        promo.name.toLowerCase().includes(searchLower) ||
        promo.code.toLowerCase().includes(searchLower) ||
        promo.description?.toLowerCase().includes(searchLower)
    );
  }, [promotions, search]);

  const handleOpenCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (promotion: Promotion) => {
    setDeletingPromotion(promotion);
    setDeleteDialogOpen(true);
  };

  const handleToggle = async (promotion: Promotion) => {
    try {
      await toggleMutation.mutateAsync(promotion.id);
    } catch (error) {
      console.error("Failed to toggle promotion:", error);
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    if (!promotion.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (isPromotionExpired(promotion.endDate)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isPromotionUpcoming(promotion.startDate)) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="flex flex-col">
      <Header title="Promotions" />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search promotions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.type || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  type: value === "all" ? undefined : (value as PromotionType),
                }))
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                filters.isActive === undefined
                  ? "all"
                  : filters.isActive
                    ? "active"
                    : "inactive"
              }
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive:
                    value === "all"
                      ? undefined
                      : value === "active"
                        ? true
                        : false,
                }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Promotion
            </Button>
          </div>
        </div>

        {/* Promotions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Promotions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !filteredPromotions.length ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <Tag className="mb-4 h-12 w-12" />
                <p>No promotions found</p>
                <Button className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first promotion
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promotion</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {getPromotionTypeIcon(promotion.type)}
                          </div>
                          <div>
                            <p className="font-medium">{promotion.name}</p>
                            {promotion.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {promotion.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {promotion.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PROMOTION_TYPE_LABELS[promotion.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getPromotionValue(promotion)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {format(new Date(promotion.startDate), "MMM d, yyyy")}
                        </div>
                        <div className="text-muted-foreground">
                          to {format(new Date(promotion.endDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {promotion.usageCount}
                        {promotion.usageLimit ? ` / ${promotion.usageLimit}` : ""}
                      </TableCell>
                      <TableCell>{getStatusBadge(promotion)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(promotion)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(promotion)}>
                              {promotion.isActive ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(promotion)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Promotion Dialog */}
      <PromotionCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Promotion Dialog */}
      {editingPromotion && (
        <PromotionEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          promotion={editingPromotion}
        />
      )}

      {/* Delete Promotion Dialog */}
      {deletingPromotion && (
        <PromotionDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          promotion={deletingPromotion}
        />
      )}
    </div>
  );
}
