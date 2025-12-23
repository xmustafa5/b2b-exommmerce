"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateOrderStatus } from "@/hooks/useDelivery";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryOrder, OrderDeliveryStatus } from "@/types/delivery";

const statusOptions: { value: OrderDeliveryStatus; label: string }[] = [
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const formSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: DeliveryOrder | null;
}

export function UpdateStatusDialog({
  open,
  onOpenChange,
  order,
}: UpdateStatusDialogProps) {
  const { toast } = useToast();
  const updateStatus = useUpdateOrderStatus();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "CONFIRMED",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && order) {
      form.reset({
        status: order.status,
        notes: "",
      });
    }
  }, [open, order, form]);

  const handleSubmit = async (data: FormData) => {
    if (!order) return;

    try {
      const result = await updateStatus.mutateAsync({
        orderId: order.id,
        data: {
          status: data.status,
          notes: data.notes,
        },
      });

      toast({
        title: "Success",
        description: result.message,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Update Order Status
          </DialogTitle>
          <DialogDescription>
            Update the delivery status for order {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Customer:</span>{" "}
                  {order.user.name}
                </p>
                <p>
                  <span className="font-medium">Address:</span>{" "}
                  {order.user.address}
                </p>
                <p>
                  <span className="font-medium">Current Status:</span>{" "}
                  {order.status}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about this status update..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateStatus.isPending}>
                {updateStatus.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
