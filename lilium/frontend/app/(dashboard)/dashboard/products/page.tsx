"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  ArrowUpDown,
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
import { useProducts } from "@/hooks/useProducts";
import type { Product, ProductFilters } from "@/types/product";
import { ProductCreateDialog } from "./_components/product-create-dialog";
import { ProductEditDialog } from "./_components/product-edit-dialog";
import { ProductDeleteDialog } from "./_components/product-delete-dialog";
import { ProductStockDialog } from "./_components/product-stock-dialog";

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 50,
  });
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const { data, isLoading } = useProducts(filters);

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;

    const searchLower = search.toLowerCase();
    return data.data.filter(
      (product) =>
        product.nameEn.toLowerCase().includes(searchLower) ||
        product.nameAr.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
    );
  }, [data?.data, search]);

  const handleOpenCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleOpenStock = (product: Product) => {
    setStockProduct(product);
    setStockDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex flex-col">
      <Header title="Products" />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex gap-2">
            <Select
              value={filters.inStock === undefined ? "all" : filters.inStock ? "instock" : "outofstock"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  inStock: value === "all" ? undefined : value === "instock",
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="instock">In Stock</SelectItem>
                <SelectItem value="outofstock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.zones || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  zones: value === "all" ? undefined : value,
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="KARKH">Karkh</SelectItem>
                <SelectItem value="RUSAFA">Rusafa</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !filteredProducts.length ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <Package className="mb-4 h-12 w-12" />
                <p>No products found</p>
                <Button className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first product
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Zones</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
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
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          {product.category?.nameEn || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {formatPrice(product.price)}
                            </p>
                            {product.compareAtPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.compareAtPrice)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleOpenStock(product)}
                            className={`cursor-pointer hover:underline ${
                              product.stock === 0
                                ? "text-destructive"
                                : product.stock < 10
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {product.stock} {product.unit}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {product.zones.map((zone) => (
                              <span
                                key={zone}
                                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                              >
                                {zone}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                product.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                            {product.isFeatured && (
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                Featured
                              </span>
                            )}
                          </div>
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

                {/* Pagination */}
                {data?.pagination && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      {(data.pagination.page - 1) * data.pagination.limit + 1}{" "}
                      to{" "}
                      {Math.min(
                        data.pagination.page * data.pagination.limit,
                        data.pagination.total
                      )}{" "}
                      of {data.pagination.total} products
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: (prev.page || 1) - 1,
                          }))
                        }
                        disabled={data.pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            page: (prev.page || 1) + 1,
                          }))
                        }
                        disabled={
                          data.pagination.page >= data.pagination.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Product Dialog */}
      <ProductCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Product Dialog */}
      {editingProduct && (
        <ProductEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          product={editingProduct}
        />
      )}

      {/* Delete Product Dialog */}
      {deletingProduct && (
        <ProductDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          product={deletingProduct}
        />
      )}

      {/* Stock Update Dialog */}
      {stockProduct && (
        <ProductStockDialog
          open={stockDialogOpen}
          onOpenChange={setStockDialogOpen}
          product={stockProduct}
        />
      )}
    </div>
  );
}
