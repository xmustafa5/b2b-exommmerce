"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderTree,
  ChevronRight,
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
import { useCategories } from "@/hooks/useCategories";
import { uploadApi } from "@/actions/upload";
import type { Category, CategoryFilters } from "@/types/category";
import { CategoryCreateDialog } from "./_components/category-create-dialog";
import { CategoryEditDialog } from "./_components/category-edit-dialog";
import { CategoryDeleteDialog } from "./_components/category-delete-dialog";

export default function CategoriesPage() {
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useCategories(filters);

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!search) return categories;

    const searchLower = search.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.nameEn.toLowerCase().includes(searchLower) ||
        cat.nameAr.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower)
    );
  }, [categories, search]);

  // Flatten categories for display (show parent > child structure)
  const flattenedCategories = useMemo(() => {
    const result: (Category & { depth: number })[] = [];

    const addCategory = (cat: Category, depth: number) => {
      result.push({ ...cat, depth });
      if (cat.children) {
        cat.children.forEach((child) => addCategory(child, depth + 1));
      }
    };

    filteredCategories.forEach((cat) => addCategory(cat, 0));
    return result;
  }, [filteredCategories]);

  const handleOpenCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col">
      <Header title="Categories" />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.includeInactive ? "all" : "active"}
              onValueChange={(value) =>
                setFilters({
                  includeInactive: value === "all" ? true : undefined,
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !flattenedCategories.length ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <FolderTree className="mb-4 h-12 w-12" />
                <p>No categories found</p>
                <Button className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flattenedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div
                          className="flex items-center gap-3"
                          style={{ paddingLeft: `${category.depth * 24}px` }}
                        >
                          {category.depth > 0 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {category.image ? (
                            <img
                              src={uploadApi.getImageUrl(category.image)}
                              alt={category.nameEn}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 items-center justify-center rounded-lg bg-muted ${category.image ? "hidden" : "flex"}`}>
                            <FolderTree className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{category.nameEn}</p>
                            {category.nameAr && (
                              <p
                                className="text-sm text-muted-foreground"
                                dir="rtl"
                              >
                                {category.nameAr}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {category.slug}
                      </TableCell>
                      <TableCell>{category._count?.products || 0}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${category.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
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
                              onClick={() => handleOpenEdit(category)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(category)}
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

      {/* Create Category Dialog */}
      <CategoryCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Category Dialog */}
      {editingCategory && (
        <CategoryEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          category={editingCategory}
        />
      )}

      {/* Delete Category Dialog */}
      {deletingCategory && (
        <CategoryDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          category={deletingCategory}
        />
      )}
    </div>
  );
}
