"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Banknote } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRecordCashCollection } from "@/hooks/useDelivery";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryOrder } from "@/types/delivery";

const formSchema = z.object({
  amount: z.number().min(0, "Amount must be positive"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CashCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: DeliveryOrder | null;
}

export function CashCollectionDialog({
  open,
  onOpenChange,
  order,
}: CashCollectionDialogProps) {
  const { toast } = useToast();
  const recordCash = useRecordCashCollection();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (open && order) {
      form.reset({
        amount: order.total,
        notes: "",
      });
    }
  }, [open, order, form]);

  const handleSubmit = async (data: FormData) => {
    if (!order) return;

    try {
      const result = await recordCash.mutateAsync({
        orderId: order.id,
        data: {
          amount: data.amount,
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
          error.response?.data?.message || "Failed to record cash collection",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Record Cash Collection
          </DialogTitle>
          <DialogDescription>
            Record the cash collected for order {order.orderNumber}
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
                  <span className="font-medium">Phone:</span> {order.user.phone}
                </p>
                <p>
                  <span className="font-medium">Order Total:</span>{" "}
                  <span className="text-green-600 font-bold">
                    {formatCurrency(order.total)}
                  </span>
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Collected (IQD) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
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
                      placeholder="Add notes about the cash collection..."
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
              <Button type="submit" disabled={recordCash.isPending}>
                {recordCash.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Record Collection
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
