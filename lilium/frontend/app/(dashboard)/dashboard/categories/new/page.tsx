"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCategory, useCategories } from "@/hooks/useCategories";
import { getErrorMessage } from "@/actions/config";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function NewCategoryPage() {
  const router = useRouter();
  const createMutation = useCreateCategory();
  const { data: categoriesData } = useCategories({ isActive: true });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      sortOrder: 0,
    },
  });

  const parentId = watch("parentId");

  const onSubmit = async (data: CategoryFormData) => {
    try {
      // Filter out empty parentId
      const submitData = {
        ...data,
        parentId: data.parentId || undefined,
      };
      await createMutation.mutateAsync(submitData);
      router.push("/dashboard/categories");
    } catch (error) {
      console.error("Failed to create category:", getErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="New Category" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Create New Category</h2>
            <p className="text-sm text-muted-foreground">
              Add a new category to organize your products
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
              <CardDescription>
                Enter the category details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameAr">Category Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    placeholder="أدخل اسم الفئة"
                    dir="rtl"
                    {...register("nameAr")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="category-slug (auto-generated if empty)"
                  {...register("slug")}
                />
                <p className="text-xs text-muted-foreground">
                  URL-friendly name. Leave empty to auto-generate.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Enter category description"
                  {...register("description")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Category</Label>
                  <Select
                    value={parentId || "none"}
                    onValueChange={(value) =>
                      setValue("parentId", value === "none" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent (Root)</SelectItem>
                      {categoriesData?.data
                        ?.filter((c) => !c.parentId)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    placeholder="0"
                    {...register("sortOrder")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/categories">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
