"use client";

import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Tag,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types/analytics";

interface StatsCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Sales",
      value: stats ? `$${stats.totalSales.toLocaleString()}` : "-",
      icon: DollarSign,
      description: `Avg order: $${stats?.avgOrderValue.toFixed(2) || "0.00"}`,
      iconColor: "text-green-500",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders.toLocaleString() || "-",
      icon: ShoppingCart,
      description: `${stats?.pendingOrders || 0} pending`,
      iconColor: "text-blue-500",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts.toLocaleString() || "-",
      icon: Package,
      description: `${stats?.lowStockProducts || 0} low stock`,
      iconColor: "text-purple-500",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() || "-",
      icon: Users,
      description: `${stats?.totalCategories || 0} categories`,
      iconColor: "text-orange-500",
    },
  ];

  const alertCards = [
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      variant: "warning" as const,
    },
    {
      title: "Low Stock",
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      variant: "warning" as const,
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStockProducts || 0,
      icon: Package,
      variant: "danger" as const,
    },
    {
      title: "Active Promotions",
      value: stats?.activePromotions || 0,
      icon: Tag,
      variant: "success" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {alertCards.map((card) => {
          const bgColor =
            card.variant === "danger"
              ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900"
              : card.variant === "warning"
                ? "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900"
                : "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900";

          const textColor =
            card.variant === "danger"
              ? "text-red-600 dark:text-red-400"
              : card.variant === "warning"
                ? "text-amber-600 dark:text-amber-400"
                : "text-green-600 dark:text-green-400";

          return (
            <Card key={card.title} className={bgColor}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${textColor}`}>
                    {card.value}
                  </p>
                </div>
                <card.icon className={`h-8 w-8 ${textColor} opacity-50`} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
