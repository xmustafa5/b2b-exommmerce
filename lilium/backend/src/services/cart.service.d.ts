import { FastifyInstance } from 'fastify';
import { Product, Order, Zone } from '@prisma/client';
export interface CartItem {
    productId: string;
    quantity: number;
    price?: number;
    discount?: number;
}
export interface VendorCartGroup {
    companyId: string;
    companyName: string;
    items: Array<CartItem & {
        product: Product;
        subtotal: number;
        discountAmount: number;
        total: number;
    }>;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
}
export interface CartSummary {
    vendorGroups: VendorCartGroup[];
    totalItems: number;
    subtotal: number;
    totalDiscount: number;
    totalDeliveryFee: number;
    grandTotal: number;
}
export interface CheckoutInput {
    userId: string;
    addressId: string;
    items: CartItem[];
    paymentMethod?: string;
    notes?: string;
}
export interface VendorOrder {
    companyId: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
}
export declare class CartService {
    private fastify;
    constructor(fastify: FastifyInstance);
    /**
     * Validate cart items and check stock availability
     */
    validateCartItems(items: CartItem[]): Promise<{
        valid: boolean;
        errors: string[];
        validatedItems: Array<CartItem & {
            product: Product;
        }>;
    }>;
    /**
     * Group cart items by vendor/company
     */
    groupItemsByVendor(items: Array<CartItem & {
        product: Product;
    }>, userZone?: Zone): Promise<VendorCartGroup[]>;
    /**
     * Calculate delivery fee based on zones
     */
    private calculateDeliveryFee;
    /**
     * Get cart summary with vendor grouping
     */
    getCartSummary(items: CartItem[], userId?: string): Promise<CartSummary>;
    /**
     * Apply promotions to cart items
     */
    applyPromotions(items: Array<CartItem & {
        product: Product;
    }>, userId: string): Promise<Array<CartItem & {
        product: Product;
        appliedPromotion?: any;
    }>>;
    /**
     * Create orders from cart (one per vendor)
     */
    checkout(input: CheckoutInput): Promise<Order[]>;
    /**
     * Save cart for later
     */
    saveCart(userId: string, items: CartItem[]): Promise<void>;
    /**
     * Get saved cart
     */
    getSavedCart(userId: string): Promise<CartItem[]>;
    /**
     * Clear cart
     */
    clearCart(userId: string): Promise<void>;
    /**
     * Merge guest cart with user cart
     */
    mergeCart(userId: string, guestItems: CartItem[]): Promise<CartItem[]>;
    /**
     * Calculate estimated delivery time
     */
    estimateDeliveryTime(vendorGroups: VendorCartGroup[]): Promise<{
        minDays: number;
        maxDays: number;
        estimatedDate: Date;
    }>;
}
//# sourceMappingURL=cart.service.d.ts.map