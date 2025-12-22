// Inventory types aligned with backend API

export type StockUpdateType = 'RESTOCK' | 'ADJUSTMENT' | 'RETURN';

export interface StockUpdateInput {
  productId: string;
  quantity: number;
  type: StockUpdateType;
  notes?: string;
}

export interface BulkStockUpdateInput {
  updates: StockUpdateInput[];
}

export interface StockUpdateResult {
  product: {
    id: string;
    nameEn: string;
    nameAr: string;
    stock: number;
  };
  stockHistory: StockHistory;
  alertSent: boolean;
}

export interface BulkStockUpdateResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    productId: string;
    success: boolean;
    error?: string;
    result?: StockUpdateResult;
  }>;
}

export interface StockHistory {
  id: string;
  productId: string;
  type: StockUpdateType;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface StockHistoryResponse {
  history: StockHistory[];
  total: number;
}

export interface LowStockProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  price: number;
  zones: string[];
  category?: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface RestockSuggestion {
  product: {
    id: string;
    nameEn: string;
    nameAr: string;
    sku: string;
  };
  currentStock: number;
  totalSold: number;
  dailyVelocity: number;
  daysUntilOutOfStock: number;
  suggestedReorder: number;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyStockCount: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
  }>;
  byZone: Array<{
    zone: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
  }>;
}

export interface InventoryFilters {
  zone?: string;
  threshold?: number;
  search?: string;
}

export interface StockHistoryFilters {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}
