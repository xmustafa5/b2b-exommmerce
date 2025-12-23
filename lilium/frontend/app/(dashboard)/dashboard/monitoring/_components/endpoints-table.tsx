"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EndpointMetrics } from "@/types/monitoring";

interface EndpointsTableProps {
  endpoints: EndpointMetrics[] | undefined;
  isLoading: boolean;
}

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  PATCH: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

export function EndpointsTable({ endpoints, isLoading }: EndpointsTableProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endpoint Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !endpoints || endpoints.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <p>No endpoint data available</p>
            <p className="text-sm">Metrics will appear once requests are made</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg Response</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead className="text-right">Last Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((endpoint, index) => (
                <TableRow key={`${endpoint.method}-${endpoint.path}-${index}`}>
                  <TableCell>
                    <Badge
                      className={methodColors[endpoint.method] || "bg-gray-100"}
                    >
                      {endpoint.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {endpoint.path}
                  </TableCell>
                  <TableCell className="text-right">
                    {endpoint.count.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      endpoint.avgResponseTime > 500
                        ? "text-red-600"
                        : endpoint.avgResponseTime > 200
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {endpoint.avgResponseTime.toFixed(1)}ms
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      endpoint.errorCount > 0 ? "text-red-600" : ""
                    }`}
                  >
                    {endpoint.errorCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatTime(endpoint.lastAccessed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
