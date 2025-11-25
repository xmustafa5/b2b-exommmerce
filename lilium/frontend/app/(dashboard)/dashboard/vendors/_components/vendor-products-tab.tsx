"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  ArrowUpDown,
} from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorProducts } from "@/hooks/useVendors";
import type { VendorProduct, VendorProductFilters } from "@/types/vendor";
import { VendorProductCreateDialog } from "./vendor-product-create-dialog";
import { VendorProductEditDialog } from "./vendor-product-edit-dialog";
import { VendorProductDeleteDialog } from "./vendor-product-delete-dialog";
import { VendorProductStockDialog } from "./vendor-product-stock-dialog";

export function VendorProductsTab() {
  const [filters, setFilters] = useState<VendorProductFilters>({});
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(
    null
  );
  const [deletingProduct, setDeletingProduct] = useState<VendorProduct | null>(
    null
  );
  const [stockProduct, setStockProduct] = useState<VendorProduct | null>(null);

  const { data, isLoading } = useVendorProducts({ ...filters, search });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (product: VendorProduct) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (product: VendorProduct) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleOpenStock = (product: VendorProduct) => {
    setStockProduct(product);
    setStockDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Products</CardTitle>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>

              <Select
                value={
                  filters.isActive === undefined
                    ? "all"
                    : filters.isActive
                      ? "active"
                      : "inactive"
                }
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    isActive:
                      value === "all"
                        ? undefined
                        : value === "active"
                          ? true
                          : false,
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !data?.data?.length ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
              <Package className="mb-4 h-12 w-12" />
              <p>No products found</p>
              <Button className="mt-4" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{product.nameEn}</p>
                          {product.nameAr && (
                            <p
                              className="text-sm text-muted-foreground"
                              dir="rtl"
                            >
                              {product.nameAr}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{product.category.nameEn}</p>
                        {product.category.nameAr && (
                          <p className="text-xs text-muted-foreground" dir="rtl">
                            {product.category.nameAr}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={product.stock > 0 ? "default" : "destructive"}
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(product)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenStock(product)}
                          >
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Update Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(product)}
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

          {data && data.pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {data?.data?.length} of {data.pagination.total} products
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page === 1}
                  onClick={() =>
                    setFilters({ ...filters, page: data.pagination.page - 1 })
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    data.pagination.page >= data.pagination.totalPages
                  }
                  onClick={() =>
                    setFilters({ ...filters, page: data.pagination.page + 1 })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VendorProductCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editingProduct && (
        <VendorProductEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          product={editingProduct}
        />
      )}

      {deletingProduct && (
        <VendorProductDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          product={deletingProduct}
        />
      )}

      {stockProduct && (
        <VendorProductStockDialog
          open={stockDialogOpen}
          onOpenChange={setStockDialogOpen}
          product={stockProduct}
        />
      )}
    </>
  );
}
