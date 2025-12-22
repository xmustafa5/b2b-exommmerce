"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderStatusCount, ZoneSales } from "@/types/analytics";

interface OrdersChartProps {
  ordersByStatus: OrderStatusCount[] | undefined;
  salesByZone: ZoneSales[] | undefined;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
};

const ZONE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export function OrdersChart({
  ordersByStatus,
  salesByZone,
  isLoading,
}: OrdersChartProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Orders by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
          <CardDescription>Distribution of orders by current status</CardDescription>
        </CardHeader>
        <CardContent>
          {!ordersByStatus || ordersByStatus.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <p>No order data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="status"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">
                              {payload[0]?.payload?.status}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Count: {payload[0]?.value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || "#6b7280"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Zone</CardTitle>
          <CardDescription>Revenue distribution across zones</CardDescription>
        </CardHeader>
        <CardContent>
          {!salesByZone || salesByZone.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <p>No zone data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByZone as any[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="total"
                    nameKey="zone"
                    label={(props: any) =>
                      `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {salesByZone.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ZONE_COLORS[index % ZONE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">
                              {payload[0]?.payload?.zone}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Sales: ${Number(payload[0]?.value || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Orders: {payload[0]?.payload?.count}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
