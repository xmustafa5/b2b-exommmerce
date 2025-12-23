import { apiClient } from "./config";

// Export filters
export interface OrdersExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  zone?: string;
}

export interface ProductsExportFilters {
  categoryId?: string;
  inStock?: boolean;
}

export interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
}

// Helper function to trigger file download
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const exportApi = {
  // Export orders to CSV
  ordersCSV: async (filters?: OrdersExportFilters): Promise<void> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.zone) params.append("zone", filters.zone);

    const { data } = await apiClient.get(`/export/orders/csv?${params}`, {
      responseType: "blob",
    });

    downloadFile(data, `orders-${Date.now()}.csv`);
  },

  // Export products to CSV
  productsCSV: async (filters?: ProductsExportFilters): Promise<void> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append("categoryId", filters.categoryId);
    if (filters?.inStock !== undefined)
      params.append("inStock", String(filters.inStock));

    const { data } = await apiClient.get(`/export/products/csv?${params}`, {
      responseType: "blob",
    });

    downloadFile(data, `products-${Date.now()}.csv`);
  },

  // Export sales report to PDF
  salesPDF: async (filters?: SalesReportFilters): Promise<void> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const { data } = await apiClient.get(`/export/sales/pdf?${params}`, {
      responseType: "blob",
    });

    downloadFile(data, `sales-report-${Date.now()}.pdf`);
  },

  // Export inventory report to PDF
  inventoryPDF: async (): Promise<void> => {
    const { data } = await apiClient.get("/export/inventory/pdf", {
      responseType: "blob",
    });

    downloadFile(data, `inventory-report-${Date.now()}.pdf`);
  },

  // Export customers to CSV
  customersCSV: async (): Promise<void> => {
    const { data } = await apiClient.get("/export/customers/csv", {
      responseType: "blob",
    });

    downloadFile(data, `customers-${Date.now()}.csv`);
  },
};
