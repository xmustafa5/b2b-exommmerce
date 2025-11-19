"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Trash2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, Column } from "@/components/shared/data-table";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { useProducts, useBulkDeleteProducts } from "@/app/hooks/useProducts";
import { useCategories } from "@/app/hooks/useCategories";
import type { Product } from "@/app/types/product";

export default function ProductsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: productsData, isLoading } = useProducts({
    search,
    categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
    page,
    pageSize: 10,
  });

  const { data: categories } = useCategories();
  const bulkDeleteMutation = useBulkDeleteProducts();

  const columns: Column<Product>[] = [
    {
      header: "",
      cell: (row) => (
        <Checkbox
          checked={selectedProducts.includes(row.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedProducts([...selectedProducts, row.id]);
            } else {
              setSelectedProducts(selectedProducts.filter((id) => id !== row.id));
            }
          }}
        />
      ),
    },
    {
      header: "Image",
      cell: (row) => (
        <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
          {row.images[0] ? (
            <img
              src={row.images[0]}
              alt={row.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.nameAr}</div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row) => row.category?.name || "N/A",
    },
    {
      header: "Price",
      accessorKey: "price",
      sortable: true,
      cell: (row) => `$${row.price.toFixed(2)}`,
    },
    {
      header: "Stock",
      accessorKey: "stock",
      sortable: true,
      cell: (row) => (
        <Badge variant={row.stock > 10 ? "default" : "destructive"}>
          {row.stock}
        </Badge>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/products/${row.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/products/${row.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleBulkDelete = async () => {
    await bulkDeleteMutation.mutateAsync(selectedProducts);
    setSelectedProducts([]);
    setDeleteDialogOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === productsData?.data.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsData?.data.map((p) => p.id) || []);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProducts.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedProducts.length})
          </Button>
        )}
      </div>

      {/* Select All */}
      {productsData && productsData.data?.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedProducts.length === productsData.data.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-gray-600">
            Select all ({productsData.data.length})
          </span>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={productsData?.data || []}
        pagination={
          productsData
            ? {
              page: productsData.page,
              pageSize: productsData.pageSize,
              total: productsData.total,
              totalPages: productsData.totalPages,
            }
            : undefined
        }
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="No products found"
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedProducts.length} product(s)?`}
        description="This action cannot be undone. The selected products will be permanently deleted."
        loading={bulkDeleteMutation.isPending}
      />
    </div>
  );
}
