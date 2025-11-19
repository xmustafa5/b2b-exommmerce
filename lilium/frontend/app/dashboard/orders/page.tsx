'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useOrders } from '@/app/hooks/useOrders';
import { OrderStatus, type OrderFilters } from '@/app/types/order';
import { StatusBadge } from '@/components/orders/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, Search, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: ordersData, isLoading, isError } = useOrders(filters);

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const getTotalItems = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track all customer orders
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter orders by status, zone, date range, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order # or customer..."
                className="pl-9"
                value={filters.search || ''}
                onChange={handleSearch}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status ?? 'ALL'}
              onValueChange={(value) =>
                handleFilterChange('status', value === 'ALL' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={OrderStatus.PROCESSING}>
                  Processing
                </SelectItem>
                <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Zone Filter */}
            <Select
              value={filters.zone ?? 'ALL'}
              onValueChange={(value) =>
                handleFilterChange('zone', value === 'ALL' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Zones</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="Central">Central</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  page: 1,
                  pageSize: 20,
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-600">
              Failed to load orders. Please try again.
            </div>
          ) : !ordersData?.data || ordersData.data.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No orders found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData.data.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.user.shopName || (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                            {order.user.zone}
                          </span>
                        </TableCell>
                        <TableCell>{getTotalItems(order.items)} items</TableCell>
                        <TableCell className="font-medium">
                          ${order.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/orders/${order.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {ordersData && ordersData.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(ordersData.page - 1) * ordersData.pageSize + 1} to{' '}
                    {Math.min(
                      ordersData.page * ordersData.pageSize,
                      ordersData.total
                    )}{' '}
                    of {ordersData.total} orders
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(ordersData.page - 1)}
                      disabled={ordersData.page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(ordersData.totalPages)].map((_, i) => {
                        const page = i + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === ordersData.totalPages ||
                          (page >= ordersData.page - 1 &&
                            page <= ordersData.page + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={
                                page === ordersData.page ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        } else if (
                          page === ordersData.page - 2 ||
                          page === ordersData.page + 2
                        ) {
                          return <span key={page}>...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(ordersData.page + 1)}
                      disabled={ordersData.page === ordersData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
