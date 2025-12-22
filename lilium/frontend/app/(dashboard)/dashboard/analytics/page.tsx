"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardStats, useSalesStats, useProductStats } from "@/hooks/useAnalytics";
import type { DateRangeFilter } from "@/types/analytics";
import { StatsCards } from "./_components/stats-cards";
import { SalesChart } from "./_components/sales-chart";
import { OrdersChart } from "./_components/orders-chart";
import { TopProductsTable } from "./_components/top-products-table";
import { DateRangePicker } from "./_components/date-range-picker";

export default function AnalyticsPage() {
  // Default to last 30 days
  const [filters, setFilters] = useState<DateRangeFilter>({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    zone: undefined,
  });

  // Queries
  const {
    data: dashboardStats,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useDashboardStats(filters);

  const {
    data: salesStats,
    isLoading: isLoadingSales,
    refetch: refetchSales,
  } = useSalesStats(filters);

  const {
    data: productStats,
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useProductStats(filters);

  const handleDateChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleZoneChange = (zone: string | undefined) => {
    setFilters((prev) => ({ ...prev, zone }));
  };

  const handleRefresh = () => {
    refetchDashboard();
    refetchSales();
    refetchProducts();
  };

  const isLoading = isLoadingDashboard || isLoadingSales || isLoadingProducts;

  return (
    <div className="flex flex-col">
      <Header title="Analytics" />

      <div className="flex-1 space-y-6 p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DateRangePicker
            startDate={filters.startDate || ""}
            endDate={filters.endDate || ""}
            zone={filters.zone}
            onDateChange={handleDateChange}
            onZoneChange={handleZoneChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={dashboardStats} isLoading={isLoadingDashboard} />

        {/* Tabs for different analytics views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Sales Chart */}
            <SalesChart
              data={salesStats?.salesByDay}
              isLoading={isLoadingSales}
            />

            {/* Orders & Zone Charts */}
            <OrdersChart
              ordersByStatus={dashboardStats?.ordersByStatus}
              salesByZone={dashboardStats?.salesByZone}
              isLoading={isLoadingDashboard}
            />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            {/* Sales Chart */}
            <SalesChart
              data={salesStats?.salesByDay}
              isLoading={isLoadingSales}
            />

            {/* Sales Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">
                  ${salesStats?.totalSales.toLocaleString() || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {salesStats?.totalOrders.toLocaleString() || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  ${salesStats?.avgOrderValue.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            {/* Orders & Zone Charts */}
            <OrdersChart
              ordersByStatus={dashboardStats?.ordersByStatus}
              salesByZone={salesStats?.salesByZone}
              isLoading={isLoadingDashboard || isLoadingSales}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {/* Product Stats Summary */}
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">
                  {productStats?.totalProducts || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {productStats?.activeProducts || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Featured</p>
                <p className="text-2xl font-bold text-blue-600">
                  {productStats?.featuredProducts || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">
                  {productStats?.lowStockProducts || 0}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {productStats?.outOfStockProducts || 0}
                </p>
              </div>
            </div>

            {/* Top Products Table */}
            <TopProductsTable
              products={productStats?.topSellingProducts}
              isLoading={isLoadingProducts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
