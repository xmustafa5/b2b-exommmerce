'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { useOrder, useCancelOrder } from '@/app/hooks/useOrders';
import { OrderStatus } from '@/app/types/order';
import { StatusBadge } from '@/components/orders/status-badge';
import { StatusTimeline } from '@/components/orders/status-timeline';
import { StatusUpdateForm } from '@/components/orders/status-update-form';
import { OrderItemsTable } from '@/components/orders/order-items-table';
import { InvoicePrint } from '@/components/orders/invoice-print';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  User,
  Mail,
  Phone,
  Store,
  Calendar,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: order, isLoading, isError } = useOrder(orderId);
  const cancelOrderMutation = useCancelOrder();

  const handleCancelOrder = async () => {
    await cancelOrderMutation.mutateAsync({
      id: orderId,
      input: { reason: 'Cancelled by admin' },
    });
    setCancelDialogOpen(false);
    router.push('/dashboard/orders');
  };

  const canCancelOrder = (status: OrderStatus) => {
    return status === OrderStatus.PENDING || status === OrderStatus.CONFIRMED;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Failed to load order details. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Order {order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Created {format(new Date(order.createdAt), 'MMMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoicePrint order={order} />
          {canCancelOrder(order.status) && (
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Order</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel order {order.orderNumber}?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(false)}
                  >
                    No, Keep Order
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={cancelOrderMutation.isPending}
                  >
                    Yes, Cancel Order
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Summary</CardTitle>
                <StatusBadge status={order.status} />
              </div>
              <CardDescription>
                Order placed on{' '}
                {format(new Date(order.createdAt), 'MMMM dd, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{order.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Items</p>
                  <p className="font-medium">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{order.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {order.user.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{order.user.phone}</p>
                      </div>
                    </div>
                  )}
                  {order.user.shopName && (
                    <div className="flex items-start gap-3">
                      <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Shop Name
                        </p>
                        <p className="font-medium">{order.user.shopName}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Zone</p>
                      <p className="font-medium">{order.user.zone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.deliveryAddress.street}</p>
                <p className="text-muted-foreground">
                  {order.deliveryAddress.area}, {order.deliveryAddress.city}
                </p>
                <p className="text-sm text-muted-foreground">
                  Zone: {order.deliveryAddress.zone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                {order.items.length} product(s) in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderItemsTable items={order.items} />
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    ${order.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">
                    ${order.deliveryFee.toFixed(2)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-red-600">
                      -${order.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Status Management */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
              <CardDescription>
                Track the order status progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                currentStatus={order.status}
                statusHistory={order.statusHistory}
              />
            </CardContent>
          </Card>

          {/* Status Update Form (Admin Only) */}
          {order.status !== OrderStatus.CANCELLED &&
            order.status !== OrderStatus.DELIVERED && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                  <CardDescription>
                    Change the order status and add notes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StatusUpdateForm
                    orderId={order.id}
                    currentStatus={order.status}
                  />
                </CardContent>
              </Card>
            )}

          {/* Order Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(order.updatedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
