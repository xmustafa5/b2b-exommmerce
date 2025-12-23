"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAssignDriver, useAvailableDrivers } from "@/hooks/useDelivery";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryOrder } from "@/types/delivery";

const formSchema = z.object({
  driverId: z.string().min(1, "Please select a driver"),
});

type FormData = z.infer<typeof formSchema>;

interface AssignDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: DeliveryOrder | null;
}

export function AssignDriverDialog({
  open,
  onOpenChange,
  order,
}: AssignDriverDialogProps) {
  const { toast } = useToast();
  const assignDriver = useAssignDriver();
  const { data: drivers, isLoading: isLoadingDrivers } = useAvailableDrivers();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driverId: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        driverId: "",
      });
    }
  }, [open, form]);

  const handleSubmit = async (data: FormData) => {
    if (!order) return;

    try {
      const result = await assignDriver.mutateAsync({
        orderId: order.id,
        driverId: data.driverId,
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
          error.response?.data?.message || "Failed to assign driver",
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
            <User className="h-5 w-5" />
            Assign Driver
          </DialogTitle>
          <DialogDescription>
            Assign a delivery driver to order {order.orderNumber}
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
                {order.user.zone && (
                  <p>
                    <span className="font-medium">Zone:</span> {order.user.zone}
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Driver *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingDrivers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingDrivers
                              ? "Loading drivers..."
                              : "Select a driver"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers?.length === 0 ? (
                        <SelectItem value="" disabled>
                          No available drivers
                        </SelectItem>
                      ) : (
                        drivers?.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name} - {driver.phone}
                            {driver.vehicleType &&
                              ` (${driver.vehicleType})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={assignDriver.isPending}>
                {assignDriver.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign Driver
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
