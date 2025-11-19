'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OrderStatus } from '@/app/types/order';
import { useUpdateOrderStatus } from '@/app/hooks/useOrders';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    required_error: 'Please select a status',
  }),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface StatusUpdateFormProps {
  orderId: string;
  currentStatus: OrderStatus;
  onSuccess?: () => void;
}

const statusOptions = [
  { value: OrderStatus.PENDING, label: 'Pending' },
  { value: OrderStatus.CONFIRMED, label: 'Confirmed' },
  { value: OrderStatus.PROCESSING, label: 'Processing' },
  { value: OrderStatus.SHIPPED, label: 'Shipped' },
  { value: OrderStatus.DELIVERED, label: 'Delivered' },
];

export function StatusUpdateForm({
  orderId,
  currentStatus,
  onSuccess,
}: StatusUpdateFormProps) {
  const updateStatusMutation = useUpdateOrderStatus(orderId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: currentStatus,
      note: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await updateStatusMutation.mutateAsync(data);
    form.reset({ status: data.status, note: '' });
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add a note about this status change..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updateStatusMutation.isPending}
          className="w-full"
        >
          {updateStatusMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Update Status
        </Button>
      </form>
    </Form>
  );
}
