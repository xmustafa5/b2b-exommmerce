"use client";

import { Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCompanyProducts } from "@/hooks/useCompanies";
import type { Company } from "@/types/company";

interface CompanyProductsDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyProductsDialog({
  company,
  open,
  onOpenChange,
}: CompanyProductsDialogProps) {
  const { data, isLoading } = useCompanyProducts(company?.id || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products - {company?.nameEn}
          </DialogTitle>
          <DialogDescription>
            View all products from this company
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading products...
          </div>
        ) : data?.products.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No products found for this company
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total Products: {data?.total || 0}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.nameEn}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.nameAr}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-IQ", {
                        style: "currency",
                        currency: "IQD",
                        minimumFractionDigits: 0,
                      }).format(product.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.stock > 0 ? "default" : "destructive"}
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
