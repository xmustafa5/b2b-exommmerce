"use client";

import { useState } from "react";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorStats } from "@/hooks/useVendors";
import { VendorProductsTab } from "./_components/vendor-products-tab";
import { VendorOrdersTab } from "./_components/vendor-orders-tab";
import { VendorCustomersTab } from "./_components/vendor-customers-tab";

export default function VendorsPage() {
  const { data: stats, isLoading: statsLoading } = useVendorStats();
  const [activeTab, setActiveTab] = useState("products");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  return (
    <div className="flex flex-col">
      <Header title="Vendor Dashboard" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeProducts || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingOrders || 0} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.completedOrders || 0} completed orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalCustomers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Products, Orders, Customers */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <VendorProductsTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <VendorOrdersTab />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <VendorCustomersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
