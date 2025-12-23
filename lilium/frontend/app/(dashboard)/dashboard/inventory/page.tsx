"use client";

import { useState, useMemo } from "react";
import {
  Search,
  MoreHorizontal,
  Package,
  AlertTriangle,
  XCircle,
  History,
  Pencil,
  Boxes,
  Download,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useLowStockProducts,
  useOutOfStockProducts,
  useInventoryReport,
} from "@/hooks/useInventory";
import { exportApi } from "@/actions/export";
import { useToast } from "@/hooks/use-toast";
import type { LowStockProduct, InventoryFilters } from "@/types/inventory";
import { StockUpdateDialog } from "./_components/stock-update-dialog";
import { BulkUpdateDialog } from "./_components/bulk-update-dialog";
import { StockHistoryTable } from "./_components/stock-history-table";
import { RestockSuggestionsCard } from "./_components/restock-suggestions-card";

export default function InventoryPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("low-stock");
  const [selectedProducts, setSelectedProducts] = useState<LowStockProduct[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Dialogs
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LowStockProduct | null>(null);

  // Queries
  const { data: lowStockProducts, isLoading: isLoadingLowStock } =
    useLowStockProducts(filters);
  const { data: outOfStockProducts, isLoading: isLoadingOutOfStock } =
    useOutOfStockProducts(filters.zone);
  const { data: report, isLoading: isLoadingReport } = useInventoryReport(
    filters.zone
  );

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportApi.inventoryPDF();
      toast({
        title: "Success",
        description: "Inventory report exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to export inventory report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter products by search
  const filteredLowStock = useMemo(() => {
    if (!lowStockProducts) return [];
    if (!search) return lowStockProducts;

    const searchLower = search.toLowerCase();
    return lowStockProducts.filter(
      (product) =>
        product.nameEn.toLowerCase().includes(searchLower) ||
        product.nameAr.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
    );
  }, [lowStockProducts, search]);

  const filteredOutOfStock = useMemo(() => {
    if (!outOfStockProducts) return [];
    if (!search) return outOfStockProducts;

    const searchLower = search.toLowerCase();
    return outOfStockProducts.filter(
      (product) =>
        product.nameEn.toLowerCase().includes(searchLower) ||
        product.nameAr.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
    );
  }, [outOfStockProducts, search]);

  const handleOpenUpdate = (product: LowStockProduct) => {
    setSelectedProduct(product);
    setUpdateDialogOpen(true);
  };

  const handleOpenHistory = (product: LowStockProduct) => {
    setSelectedProduct(product);
    setHistoryDialogOpen(true);
  };

  const handleToggleSelect = (product: LowStockProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleSelectAll = (products: LowStockProduct[]) => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products);
    }
  };

  const getStockBadge = (product: LowStockProduct) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.stock <= product.lowStockThreshold) {
      return <Badge variant="default" className="bg-amber-500">Low Stock</Badge>;
    }
    return <Badge variant="secondary">In Stock</Badge>;
  };

  const currentProducts =
    activeTab === "low-stock" ? filteredLowStock : filteredOutOfStock;
  const isLoading =
    activeTab === "low-stock" ? isLoadingLowStock : isLoadingOutOfStock;

  return (
    <div className="flex flex-col">
      <Header title="Inventory Management" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingReport ? "-" : report?.totalProducts || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {isLoadingReport ? "-" : report?.lowStockCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoadingReport ? "-" : report?.outOfStockCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Value
              </CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${isLoadingReport ? "-" : (report?.totalValue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restock Suggestions */}
        <RestockSuggestionsCard onUpdateStock={handleOpenUpdate} />

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Inventory Status</CardTitle>

              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 pl-9"
                  />
                </div>

                <Select
                  value={filters.zone || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      zone: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    <SelectItem value="KARKH">KARKH</SelectItem>
                    <SelectItem value="RUSAFA">RUSAFA</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export PDF
                </Button>

                {selectedProducts.length > 0 && (
                  <Button onClick={() => setBulkUpdateDialogOpen(true)}>
                    Update {selectedProducts.length} Selected
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="low-stock" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Low Stock
                  {lowStockProducts && lowStockProducts.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {lowStockProducts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="out-of-stock" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Out of Stock
                  {outOfStockProducts && outOfStockProducts.length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {outOfStockProducts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="low-stock" className="m-0">
                {isLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : !filteredLowStock.length ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Package className="mb-4 h-12 w-12" />
                    <p>No low stock products found</p>
                  </div>
                ) : (
                  <ProductTable
                    products={filteredLowStock}
                    selectedProducts={selectedProducts}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={() => handleSelectAll(filteredLowStock)}
                    onUpdate={handleOpenUpdate}
                    onViewHistory={handleOpenHistory}
                    getStockBadge={getStockBadge}
                  />
                )}
              </TabsContent>

              <TabsContent value="out-of-stock" className="m-0">
                {isLoadingOutOfStock ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : !filteredOutOfStock.length ? (
                  <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                    <Package className="mb-4 h-12 w-12" />
                    <p>No out of stock products</p>
                  </div>
                ) : (
                  <ProductTable
                    products={filteredOutOfStock}
                    selectedProducts={selectedProducts}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={() => handleSelectAll(filteredOutOfStock)}
                    onUpdate={handleOpenUpdate}
                    onViewHistory={handleOpenHistory}
                    getStockBadge={getStockBadge}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Update Stock Dialog */}
      {selectedProduct && (
        <StockUpdateDialog
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          product={selectedProduct}
        />
      )}

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog
        open={bulkUpdateDialogOpen}
        onOpenChange={setBulkUpdateDialogOpen}
        selectedProducts={selectedProducts}
        onSuccess={() => setSelectedProducts([])}
      />

      {/* Stock History Dialog */}
      {selectedProduct && (
        <StockHistoryTable
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.nameEn}
        />
      )}
    </div>
  );
}

// Extracted product table component
interface ProductTableProps {
  products: LowStockProduct[];
  selectedProducts: LowStockProduct[];
  onToggleSelect: (product: LowStockProduct) => void;
  onSelectAll: () => void;
  onUpdate: (product: LowStockProduct) => void;
  onViewHistory: (product: LowStockProduct) => void;
  getStockBadge: (product: LowStockProduct) => React.ReactNode;
}

function ProductTable({
  products,
  selectedProducts,
  onToggleSelect,
  onSelectAll,
  onUpdate,
  onViewHistory,
  getStockBadge,
}: ProductTableProps) {
  const allSelected = selectedProducts.length === products.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={allSelected && products.length > 0}
              onChange={onSelectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
          </TableHead>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Threshold</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const isSelected = selectedProducts.some((p) => p.id === product.id);

          return (
            <TableRow key={product.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(product)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{product.nameEn}</p>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {product.nameAr}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell>
                {product.category?.nameEn || "-"}
              </TableCell>
              <TableCell className="text-right font-medium">
                <span
                  className={
                    product.stock === 0
                      ? "text-destructive"
                      : product.stock <= product.lowStockThreshold
                        ? "text-amber-600"
                        : ""
                  }
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {product.lowStockThreshold}
              </TableCell>
              <TableCell>{getStockBadge(product)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUpdate(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Update Stock
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewHistory(product)}>
                      <History className="mr-2 h-4 w-4" />
                      View History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
