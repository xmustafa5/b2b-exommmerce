"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { DateRangePicker } from "./date-range-picker";
import { ProductMultiSelect } from "./product-multi-select";
import { CategoryMultiSelect } from "./category-multi-select";
import { useCreatePromotion, useUpdatePromotion } from "@/app/hooks/usePromotions";
import type { Promotion } from "@/app/types/promotion";

const zones = [
  { id: "north", label: "North" },
  { id: "south", label: "South" },
  { id: "east", label: "East" },
  { id: "west", label: "West" },
  { id: "central", label: "Central" },
];

const formSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionAr: z.string().min(1, "Arabic description is required"),
  type: z.enum(["percentage", "fixed"], {
    required_error: "Promotion type is required",
  }),
  value: z.number().min(0.01, "Value must be greater than 0"),
  minPurchase: z.number().optional(),
  maxDiscount: z.number().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  zones: z.array(z.string()).min(1, "Select at least one zone"),
  products: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface PromotionFormProps {
  promotion?: Promotion;
  mode: "create" | "edit";
}

export function PromotionForm({ promotion, mode }: PromotionFormProps) {
  const router = useRouter();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion(promotion?.id || "");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: promotion
      ? {
          nameEn: promotion.nameEn,
          nameAr: promotion.nameAr,
          descriptionEn: promotion.descriptionEn,
          descriptionAr: promotion.descriptionAr,
          type: promotion.type,
          value: promotion.value,
          minPurchase: promotion.minPurchase,
          maxDiscount: promotion.maxDiscount,
          dateRange: {
            from: new Date(promotion.startDate),
            to: new Date(promotion.endDate),
          },
          zones: promotion.zones,
          products: promotion.products,
          categories: promotion.categories,
          isActive: promotion.isActive,
        }
      : {
          nameEn: "",
          nameAr: "",
          descriptionEn: "",
          descriptionAr: "",
          type: "percentage",
          value: 0,
          zones: [],
          products: [],
          categories: [],
          isActive: true,
        },
  });

  const watchType = form.watch("type");

  const onSubmit = async (data: FormData) => {
    const payload = {
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      descriptionEn: data.descriptionEn,
      descriptionAr: data.descriptionAr,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase,
      maxDiscount: data.maxDiscount,
      startDate: data.dateRange.from,
      endDate: data.dateRange.to,
      zones: data.zones,
      products: data.products,
      categories: data.categories,
      isActive: data.isActive,
    };

    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      router.push("/dashboard/promotions");
    } else {
      await updateMutation.mutateAsync(payload);
      router.push(`/dashboard/promotions/${promotion?.id}`);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Multilingual Name Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English)</FormLabel>
                <FormControl>
                  <Input placeholder="Summer Sale" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Arabic)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="تخفيضات الصيف"
                    {...field}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Multilingual Description Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Get amazing discounts this summer"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descriptionAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Arabic)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="احصل على خصومات مذهلة هذا الصيف"
                    {...field}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Type and Value Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Promotion Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="percentage" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Percentage Discount
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="fixed" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Fixed Amount Discount
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {watchType === "percentage" ? "Percentage (%)" : "Amount"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={watchType === "percentage" ? "10" : "50.00"}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {watchType === "percentage"
                    ? "Enter percentage (e.g., 10 for 10%)"
                    : "Enter fixed amount to discount"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Min Purchase and Max Discount Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="minPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Purchase (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Minimum order value to apply promotion
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchType === "percentage" && (
            <FormField
              control={form.control}
              name="maxDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Discount (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum discount amount for percentage-based promotions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Date Range Section */}
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promotion Period</FormLabel>
              <FormControl>
                <DateRangePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>
                Select the start and end dates for this promotion
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Zones Section */}
        <FormField
          control={form.control}
          name="zones"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Delivery Zones</FormLabel>
                <FormDescription>
                  Select the zones where this promotion is available
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {zones.map((zone) => (
                  <FormField
                    key={zone.id}
                    control={form.control}
                    name="zones"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={zone.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(zone.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, zone.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== zone.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {zone.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Products Section */}
        <FormField
          control={form.control}
          name="products"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Products (Optional)</FormLabel>
              <FormControl>
                <ProductMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Leave empty to apply to all products, or select specific
                products
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categories Section */}
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories (Optional)</FormLabel>
              <FormControl>
                <CategoryMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Leave empty to apply to all categories, or select specific
                categories
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this promotion
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Promotion" : "Update Promotion"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
