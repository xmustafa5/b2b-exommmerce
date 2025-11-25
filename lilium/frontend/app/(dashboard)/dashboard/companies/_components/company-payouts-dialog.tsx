"use client";

import { useState } from "react";
import { DollarSign, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCompanyPayouts } from "@/hooks/useCompanies";
import type { Company } from "@/types/company";

interface CompanyPayoutsDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyPayoutsDialog({
  company,
  open,
  onOpenChange,
}: CompanyPayoutsDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enableQuery, setEnableQuery] = useState(false);

  const { data, isLoading } = useCompanyPayouts(
    company?.id || "",
    startDate,
    endDate,
    enableQuery
  );

  const handleCalculate = () => {
    if (startDate && endDate) {
      setEnableQuery(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) {
          setStartDate("");
          setEndDate("");
          setEnableQuery(false);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Company Payouts - {company?.nameEn}
          </DialogTitle>
          <DialogDescription>
            Calculate payouts for a specific date range
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!startDate || !endDate || isLoading}
            className="w-full"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Calculate Payouts
          </Button>

          {/* Results */}
          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">
                      Total Orders
                    </div>
                    <div className="text-2xl font-bold">
                      {data.totalOrders}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">
                      Commission Rate
                    </div>
                    <div className="text-2xl font-bold">
                      {data.commissionRate}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">
                      Total Revenue
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(data.totalRevenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">
                      Total Commission
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(data.totalCommission)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">
                    Company Payout
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(data.totalPayout)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Period: {new Date(data.period.start).toLocaleDateString()} -{" "}
                    {new Date(data.period.end).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isLoading && (
            <div className="py-8 text-center text-muted-foreground">
              Calculating payouts...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
