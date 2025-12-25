import { z } from 'zod';

/**
 * Checkout form validation schema
 */
export const checkoutSchema = z.object({
  deliveryAddress: z
    .string()
    .min(1, 'Delivery address is required')
    .min(10, 'Please enter a complete address'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Order item schema
 */
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export type OrderItemData = z.infer<typeof orderItemSchema>;

/**
 * Create order schema
 */
export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required'),
  deliveryAddress: z
    .string()
    .min(1, 'Delivery address is required')
    .min(10, 'Please enter a complete address'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;
