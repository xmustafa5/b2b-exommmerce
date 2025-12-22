# DASHBOARD INTEGRATION PLAN
## Lilium B2B E-Commerce Admin Dashboard - Frontend Integration Guide

**Last Updated:** December 22, 2025
**Backend Status:** 100% Complete - Ready for Integration

---

## DEVELOPMENT PROGRESS TRACKER

### Phase 1: Core Features (High Priority)

#### 1.1 Promotions Management
- [x] Create `types/promotion.ts` with all interfaces
- [x] Add promotionsQueryKeys to `constants/queryKeys.ts`
- [x] Create `actions/promotions.ts` API module
- [x] Create `hooks/usePromotions.ts` custom hooks
- [x] Create `dashboard/promotions/_components/promotion-create-dialog.tsx`
- [x] Create `dashboard/promotions/_components/promotion-edit-dialog.tsx`
- [x] Create `dashboard/promotions/_components/promotion-delete-dialog.tsx`
- [x] Create `dashboard/promotions/page.tsx` main page
- [ ] Test percentage discount promotions
- [ ] Test fixed amount promotions
- [ ] Test Buy X Get Y promotions
- [ ] Test Bundle deals

#### 1.2 Inventory Management
- [x] Create `types/inventory.ts` with all interfaces
- [x] Add inventoryQueryKeys to `constants/queryKeys.ts`
- [x] Create `actions/inventory.ts` API module
- [x] Create `hooks/useInventory.ts` custom hooks
- [x] Create `dashboard/inventory/_components/stock-update-dialog.tsx`
- [x] Create `dashboard/inventory/_components/bulk-update-dialog.tsx`
- [x] Create `dashboard/inventory/_components/stock-history-table.tsx`
- [x] Create `dashboard/inventory/_components/restock-suggestions-card.tsx`
- [x] Create `dashboard/inventory/page.tsx` main page
- [ ] Test single stock update
- [ ] Test bulk stock update
- [ ] Test stock history display
- [ ] Test restock suggestions

#### 1.3 Analytics Dashboard
- [x] Create `types/analytics.ts` with all interfaces
- [x] Add analyticsQueryKeys to `constants/queryKeys.ts`
- [x] Create `actions/analytics.ts` API module
- [x] Create `hooks/useAnalytics.ts` custom hooks
- [x] Install recharts: `npm install recharts`
- [x] Create `dashboard/analytics/_components/stats-cards.tsx`
- [x] Create `dashboard/analytics/_components/sales-chart.tsx`
- [x] Create `dashboard/analytics/_components/orders-chart.tsx`
- [x] Create `dashboard/analytics/_components/top-products-table.tsx`
- [x] Create `dashboard/analytics/_components/date-range-picker.tsx`
- [x] Create `dashboard/analytics/page.tsx` main page
- [ ] Test date range filtering
- [ ] Test chart rendering

### Phase 2: Medium Priority Features

#### 2.1 User Management
- [ ] Create `types/user.ts` with all interfaces
- [ ] Add usersQueryKeys to `constants/queryKeys.ts`
- [ ] Create `actions/users.ts` API module
- [ ] Create `hooks/useUsers.ts` custom hooks
- [ ] Create `dashboard/users/_components/user-create-dialog.tsx`
- [ ] Create `dashboard/users/_components/user-edit-dialog.tsx`
- [ ] Create `dashboard/users/_components/user-delete-dialog.tsx`
- [ ] Create `dashboard/users/_components/zone-assignment-dialog.tsx`
- [ ] Create `dashboard/users/page.tsx` main page
- [ ] Create `dashboard/users/admins/page.tsx` admins page
- [ ] Test user CRUD operations
- [ ] Test admin zone assignment

#### 2.2 Notifications Management
- [ ] Create `types/notification.ts` with interfaces
- [ ] Add notificationsQueryKeys to `constants/queryKeys.ts`
- [ ] Create `actions/notifications.ts` API module
- [ ] Create `hooks/useNotifications.ts` custom hooks
- [ ] Create `dashboard/notifications/_components/send-notification-dialog.tsx`
- [ ] Create `dashboard/notifications/_components/notification-history-table.tsx`
- [ ] Create `dashboard/notifications/page.tsx` main page
- [ ] Test send to user
- [ ] Test send to zone
- [ ] Test broadcast to admins

#### 2.3 Export Functionality
- [ ] Create `actions/export.ts` API module
- [ ] Add export button to Orders page
- [ ] Add export button to Products page
- [ ] Add export button to Inventory page
- [ ] Test CSV export (orders)
- [ ] Test CSV export (products)
- [ ] Test CSV export (customers)
- [ ] Test PDF export (sales report)
- [ ] Test PDF export (inventory report)

#### 2.4 Payouts Management
- [ ] Create `types/payout.ts` with interfaces
- [ ] Add payoutsQueryKeys to `constants/queryKeys.ts`
- [ ] Create `actions/payouts.ts` API module
- [ ] Create `hooks/usePayouts.ts` custom hooks
- [ ] Create `dashboard/payouts/_components/payout-create-dialog.tsx`
- [ ] Create `dashboard/payouts/_components/payout-status-dialog.tsx`
- [ ] Create `dashboard/payouts/page.tsx` main page
- [ ] Test payout creation
- [ ] Test status updates

#### 2.5 Settlements Management
- [ ] Create `types/settlement.ts` with interfaces
- [ ] Add settlementsQueryKeys to `constants/queryKeys.ts`
- [ ] Create `actions/settlements.ts` API module
- [ ] Create `hooks/useSettlements.ts` custom hooks
- [ ] Create `dashboard/settlements/_components/settlement-create-dialog.tsx`
- [ ] Create `dashboard/settlements/_components/settlement-status-dialog.tsx`
- [ ] Create `dashboard/settlements/page.tsx` main page
- [ ] Test settlement creation
- [ ] Test status updates

#### 2.6 Delivery Routes
- [ ] Create `types/delivery.ts` with interfaces
- [ ] Add deliveryQueryKeys to `constants/queryKeys.ts`
- [ ] Create `actions/delivery.ts` API module
- [ ] Create `hooks/useDelivery.ts` custom hooks
- [ ] Create `dashboard/delivery/_components/route-create-dialog.tsx`
- [ ] Create `dashboard/delivery/_components/route-edit-dialog.tsx`
- [ ] Create `dashboard/delivery/_components/order-assignment-dialog.tsx`
- [ ] Create `dashboard/delivery/page.tsx` main page
- [ ] Test route CRUD
- [ ] Test order assignment

### Phase 3: Low Priority Features

#### 3.1 API Monitoring Dashboard
- [ ] Create `types/monitoring.ts` with interfaces
- [ ] Add monitoringQueryKeys to `constants/queryKeys.ts`
- [ ] Create `actions/monitoring.ts` API module
- [ ] Create `hooks/useMonitoring.ts` custom hooks
- [ ] Create `dashboard/monitoring/_components/metrics-cards.tsx`
- [ ] Create `dashboard/monitoring/_components/endpoints-table.tsx`
- [ ] Create `dashboard/monitoring/_components/health-status.tsx`
- [ ] Create `dashboard/monitoring/_components/system-info.tsx`
- [ ] Create `dashboard/monitoring/page.tsx` main page
- [ ] Test metrics display
- [ ] Test health status

### Common Tasks
- [x] Update sidebar navigation with new menu items (Analytics added)
- [x] Install required shadcn/ui components (badge, calendar, tabs, popover)
- [x] Update `constants/queryKeys.ts` with all new keys (promotions, inventory, analytics)
- [ ] Create shared Zod schemas for form validation
- [x] Add loading skeletons for all pages
- [ ] Implement error boundaries

### Final Testing
- [ ] All CRUD operations work correctly
- [ ] Form validation matches backend Zod schemas
- [ ] Error handling displays user-friendly messages
- [ ] Loading states show properly
- [ ] Query invalidation works after mutations
- [ ] Zone-based filtering works for Location Admins
- [ ] Export downloads work correctly
- [ ] Responsive design works on all screen sizes

---

## OVERVIEW

This document outlines the integration plan for connecting the Next.js Dashboard application with the completed backend API. The dashboard is located at `/lilium/frontend/` and uses:

- **Framework:** Next.js 14 (App Router)
- **State Management:** React Query + Zustand
- **UI Components:** shadcn/ui
- **Forms:** react-hook-form + Zod
- **HTTP Client:** Axios

---

## CURRENT DASHBOARD STATUS

### Already Implemented
| Feature | Status | Location |
|---------|--------|----------|
| Categories CRUD | ✅ | `/dashboard/categories/` |
| Products CRUD | ✅ | `/dashboard/products/` |
| Companies CRUD | ✅ | `/dashboard/companies/` |
| Vendors Management | ✅ | `/dashboard/vendors/` |
| Orders Management | Partial | `/dashboard/orders/` |
| Authentication | ✅ | `/auth/login` |

### Missing Integrations
| Feature | Priority | Backend Ready |
|---------|----------|---------------|
| Promotions Management | HIGH | ✅ |
| Inventory Management | HIGH | ✅ |
| Analytics Dashboard | HIGH | ✅ |
| User Management | MEDIUM | ✅ |
| Notifications | MEDIUM | ✅ |
| Export (CSV/PDF) | MEDIUM | ✅ |
| Payouts & Settlements | MEDIUM | ✅ |
| Delivery Routes | MEDIUM | ✅ |
| API Monitoring | LOW | ✅ |

---

## INTEGRATION TASKS

### Phase 1: Core Features (High Priority)

#### 1.1 Promotions Management Page
**Backend Endpoints:**
- `GET /api/promotions` - List all promotions
- `GET /api/promotions/:id` - Get promotion details
- `POST /api/promotions` - Create promotion
- `PUT /api/promotions/:id` - Update promotion
- `DELETE /api/promotions/:id` - Delete promotion
- `POST /api/promotions/apply` - Apply to cart (preview)
- `POST /api/promotions/preview` - Preview savings

**Implementation Steps:**

1. **Create Types** (`types/promotion.ts`):
```typescript
export type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  zones?: string[];
  categoryIds?: string[];
  productIds?: string[];
  // Buy X Get Y specific
  buyQuantity?: number;
  getQuantity?: number;
  // Bundle specific
  bundleProducts?: string[];
  bundlePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionCreateInput {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  usageLimit?: number;
  zones?: string[];
  categoryIds?: string[];
  productIds?: string[];
  buyQuantity?: number;
  getQuantity?: number;
  bundleProducts?: string[];
  bundlePrice?: number;
}

export interface PromotionFilters {
  type?: PromotionType;
  isActive?: boolean;
  zone?: string;
  search?: string;
}
```

2. **Add Query Keys** (`constants/queryKeys.ts`):
```typescript
export const promotionsQueryKeys = {
  all: ["promotions"] as const,
  list: (filters?: PromotionFilters) => ["promotions", "list", filters] as const,
  detail: (id: string) => ["promotions", "detail", id] as const,
  preview: (cartItems: any[]) => ["promotions", "preview", cartItems] as const,
};
```

3. **Create API Actions** (`actions/promotions.ts`):
```typescript
import { apiClient } from './config';
import type { Promotion, PromotionCreateInput, PromotionFilters } from '@/types/promotion';

export const promotionsApi = {
  getAll: async (filters?: PromotionFilters): Promise<{ data: Promotion[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.zone) params.append('zone', filters.zone);
    if (filters?.search) params.append('search', filters.search);
    const { data } = await apiClient.get(`/promotions?${params}`);
    return data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const { data } = await apiClient.get(`/promotions/${id}`);
    return data;
  },

  create: async (input: PromotionCreateInput): Promise<Promotion> => {
    const { data } = await apiClient.post('/promotions', input);
    return data;
  },

  update: async (id: string, input: Partial<PromotionCreateInput>): Promise<Promotion> => {
    const { data } = await apiClient.put(`/promotions/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/promotions/${id}`);
  },

  preview: async (cartItems: Array<{ productId: string; quantity: number }>): Promise<{
    applicablePromotions: any[];
    totalSavings: number;
  }> => {
    const { data } = await apiClient.post('/promotions/preview', { items: cartItems });
    return data;
  },
};
```

4. **Create Custom Hooks** (`hooks/usePromotions.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsQueryKeys } from '@/constants/queryKeys';
import { promotionsApi } from '@/actions/promotions';
import type { PromotionFilters, PromotionCreateInput } from '@/types/promotion';

export function usePromotions(filters?: PromotionFilters) {
  return useQuery({
    queryKey: promotionsQueryKeys.list(filters),
    queryFn: () => promotionsApi.getAll(filters),
  });
}

export function usePromotion(id: string) {
  return useQuery({
    queryKey: promotionsQueryKeys.detail(id),
    queryFn: () => promotionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promotionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });
    },
  });
}

export function useUpdatePromotion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PromotionCreateInput>) => promotionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promotionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promotionsQueryKeys.all });
    },
  });
}
```

5. **Create Page Structure**:
```
app/(dashboard)/dashboard/promotions/
├── _components/
│   ├── promotion-create-dialog.tsx
│   ├── promotion-edit-dialog.tsx
│   └── promotion-delete-dialog.tsx
└── page.tsx
```

---

#### 1.2 Inventory Management Page
**Backend Endpoints:**
- `GET /api/inventory/low-stock` - Products below threshold
- `GET /api/inventory/out-of-stock` - Zero stock products
- `GET /api/inventory/history` - Stock change history
- `GET /api/inventory/report` - Full inventory report
- `GET /api/inventory/restock-suggestions` - AI recommendations
- `PATCH /api/inventory/stock/update` - Single product update
- `PATCH /api/inventory/bulk-update` - Bulk update

**Implementation Steps:**

1. **Create Types** (`types/inventory.ts`):
```typescript
export interface StockHistory {
  id: string;
  productId: string;
  product: {
    name: string;
    sku: string;
  };
  previousStock: number;
  newStock: number;
  change: number;
  reason: string;
  createdBy: string;
  createdAt: Date;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categories: Array<{
    id: string;
    name: string;
    productCount: number;
    totalStock: number;
  }>;
}

export interface RestockSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  suggestedQuantity: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BulkStockUpdate {
  updates: Array<{
    productId: string;
    quantity: number;
    reason?: string;
  }>;
}
```

2. **Add Query Keys** (`constants/queryKeys.ts`):
```typescript
export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  lowStock: (threshold?: number) => ["inventory", "low-stock", threshold] as const,
  outOfStock: ["inventory", "out-of-stock"] as const,
  history: (filters?: any) => ["inventory", "history", filters] as const,
  report: ["inventory", "report"] as const,
  suggestions: ["inventory", "suggestions"] as const,
};
```

3. **Create API Actions** (`actions/inventory.ts`):
```typescript
import { apiClient } from './config';
import type { StockHistory, InventoryReport, RestockSuggestion, BulkStockUpdate } from '@/types/inventory';

export const inventoryApi = {
  getLowStock: async (threshold?: number): Promise<any[]> => {
    const params = threshold ? `?threshold=${threshold}` : '';
    const { data } = await apiClient.get(`/inventory/low-stock${params}`);
    return data;
  },

  getOutOfStock: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/inventory/out-of-stock');
    return data;
  },

  getHistory: async (filters?: { productId?: string; startDate?: string; endDate?: string }): Promise<StockHistory[]> => {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const { data } = await apiClient.get(`/inventory/history?${params}`);
    return data;
  },

  getReport: async (): Promise<InventoryReport> => {
    const { data } = await apiClient.get('/inventory/report');
    return data;
  },

  getRestockSuggestions: async (): Promise<RestockSuggestion[]> => {
    const { data } = await apiClient.get('/inventory/restock-suggestions');
    return data;
  },

  updateStock: async (productId: string, quantity: number, reason?: string): Promise<void> => {
    await apiClient.patch('/inventory/stock/update', { productId, quantity, reason });
  },

  bulkUpdate: async (updates: BulkStockUpdate): Promise<void> => {
    await apiClient.patch('/inventory/bulk-update', updates);
  },
};
```

4. **Create Page Structure**:
```
app/(dashboard)/dashboard/inventory/
├── _components/
│   ├── stock-update-dialog.tsx
│   ├── bulk-update-dialog.tsx
│   ├── stock-history-table.tsx
│   └── restock-suggestions-card.tsx
└── page.tsx
```

---

#### 1.3 Analytics Dashboard Page
**Backend Endpoints:**
- `GET /api/analytics/dashboard` - Overview stats
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/products` - Product analytics
- `GET /api/analytics/notify-requests` - Notify-me analytics

**Implementation Steps:**

1. **Create Types** (`types/analytics.ts`):
```typescript
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface SalesAnalytics {
  period: string;
  data: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface ProductAnalytics {
  topSelling: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  lowPerforming: Array<{
    id: string;
    name: string;
    sales: number;
    views: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalSales: number;
  }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  zone?: string;
  groupBy?: 'day' | 'week' | 'month';
}
```

2. **Add Query Keys** (`constants/queryKeys.ts`):
```typescript
export const analyticsQueryKeys = {
  dashboard: ["analytics", "dashboard"] as const,
  sales: (filters?: AnalyticsFilters) => ["analytics", "sales", filters] as const,
  products: (filters?: AnalyticsFilters) => ["analytics", "products", filters] as const,
  notifyRequests: (filters?: AnalyticsFilters) => ["analytics", "notify-requests", filters] as const,
};
```

3. **Create Page with Charts**:
```
app/(dashboard)/dashboard/analytics/
├── _components/
│   ├── stats-cards.tsx
│   ├── sales-chart.tsx
│   ├── orders-chart.tsx
│   ├── top-products-table.tsx
│   └── date-range-picker.tsx
└── page.tsx
```

**Recommended Chart Library:** recharts or chart.js
```bash
npm install recharts
```

---

### Phase 2: Medium Priority Features

#### 2.1 User Management Page
**Backend Endpoints:**
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/admins` - List admins
- `POST /api/admins` - Create admin
- `PATCH /api/admins/:id/zones` - Update admin zones
- `PATCH /api/admins/:id/active` - Toggle active status

**Page Structure:**
```
app/(dashboard)/dashboard/users/
├── _components/
│   ├── user-create-dialog.tsx
│   ├── user-edit-dialog.tsx
│   ├── user-delete-dialog.tsx
│   └── zone-assignment-dialog.tsx
├── admins/
│   └── page.tsx
└── page.tsx
```

---

#### 2.2 Notifications Management Page
**Backend Endpoints:**
- `GET /api/notifications/status` - Firebase status
- `POST /api/notifications/send-to-user` - Send to user
- `POST /api/notifications/send-to-admins` - Broadcast to admins
- `POST /api/notifications/send-to-zone` - Zone-based send
- `POST /api/notifications/test` - Test notification

**Page Structure:**
```
app/(dashboard)/dashboard/notifications/
├── _components/
│   ├── send-notification-dialog.tsx
│   └── notification-history-table.tsx
└── page.tsx
```

---

#### 2.3 Export Functionality
**Backend Endpoints:**
- `GET /api/export/orders/csv` - Export orders
- `GET /api/export/products/csv` - Export products
- `GET /api/export/sales/pdf` - Sales report PDF
- `GET /api/export/inventory/pdf` - Inventory report PDF
- `GET /api/export/customers/csv` - Export customers

**Implementation:**
Add export buttons to relevant pages (Orders, Products, Inventory) that trigger downloads:

```typescript
// actions/export.ts
export const exportApi = {
  ordersCSV: async (filters?: any): Promise<Blob> => {
    const { data } = await apiClient.get('/export/orders/csv', {
      params: filters,
      responseType: 'blob',
    });
    return data;
  },

  salesPDF: async (filters?: any): Promise<Blob> => {
    const { data } = await apiClient.get('/export/sales/pdf', {
      params: filters,
      responseType: 'blob',
    });
    return data;
  },
  // ... other exports
};

// Usage in component
const handleExport = async () => {
  const blob = await exportApi.ordersCSV(filters);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString()}.csv`;
  a.click();
};
```

---

#### 2.4 Payouts & Settlements Pages
**Backend Endpoints:**
- `GET /api/payouts` - List payouts
- `POST /api/payouts` - Create payout
- `PATCH /api/payouts/:id/status` - Update status
- `GET /api/settlements` - List settlements
- `POST /api/settlements` - Create settlement
- `PATCH /api/settlements/:id/status` - Update status

**Page Structure:**
```
app/(dashboard)/dashboard/payouts/
├── _components/
│   ├── payout-create-dialog.tsx
│   └── payout-status-dialog.tsx
└── page.tsx

app/(dashboard)/dashboard/settlements/
├── _components/
│   ├── settlement-create-dialog.tsx
│   └── settlement-status-dialog.tsx
└── page.tsx
```

---

#### 2.5 Delivery Routes Page
**Backend Endpoints:**
- `GET /api/delivery/routes` - List routes
- `POST /api/delivery/routes` - Create route
- `PUT /api/delivery/routes/:id` - Update route
- `DELETE /api/delivery/routes/:id` - Delete route
- `PATCH /api/delivery/routes/:id/orders` - Assign orders

**Page Structure:**
```
app/(dashboard)/dashboard/delivery/
├── _components/
│   ├── route-create-dialog.tsx
│   ├── route-edit-dialog.tsx
│   ├── order-assignment-dialog.tsx
│   └── route-map.tsx (optional - Google Maps integration)
└── page.tsx
```

---

### Phase 3: Low Priority Features

#### 3.1 API Monitoring Dashboard
**Backend Endpoints:**
- `GET /api/monitoring/metrics` - API metrics
- `GET /api/monitoring/endpoints` - Per-endpoint stats
- `GET /api/monitoring/health` - Health status
- `GET /api/monitoring/system` - System info

**Page Structure:**
```
app/(dashboard)/dashboard/monitoring/
├── _components/
│   ├── metrics-cards.tsx
│   ├── endpoints-table.tsx
│   ├── health-status.tsx
│   └── system-info.tsx
└── page.tsx
```

---

## EXISTING CODE UPDATES

### Update Navigation Sidebar
Add new menu items to the dashboard sidebar:

```typescript
// components/layout/sidebar.tsx
const menuItems = [
  // ... existing items
  { label: 'Promotions', href: '/dashboard/promotions', icon: TagIcon },
  { label: 'Inventory', href: '/dashboard/inventory', icon: PackageIcon },
  { label: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { label: 'Users', href: '/dashboard/users', icon: UsersIcon },
  { label: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
  { label: 'Payouts', href: '/dashboard/payouts', icon: CreditCardIcon },
  { label: 'Settlements', href: '/dashboard/settlements', icon: BanknotesIcon },
  { label: 'Delivery', href: '/dashboard/delivery', icon: TruckIcon },
  { label: 'Monitoring', href: '/dashboard/monitoring', icon: ActivityIcon },
];
```

### Update Query Keys File
Consolidate all query keys in `constants/queryKeys.ts`:

```typescript
// Add all new query keys for promotions, inventory, analytics, etc.
```

---

## IMPLEMENTATION ORDER

| Week | Tasks | Priority |
|------|-------|----------|
| 1 | Promotions CRUD (all promotion types) | HIGH |
| 1 | Inventory Management + Stock History | HIGH |
| 2 | Analytics Dashboard with Charts | HIGH |
| 2 | Export Functionality (CSV/PDF) | MEDIUM |
| 3 | User Management + Admin Zones | MEDIUM |
| 3 | Notifications Management | MEDIUM |
| 4 | Payouts & Settlements | MEDIUM |
| 4 | Delivery Routes | MEDIUM |
| 5 | API Monitoring Dashboard | LOW |
| 5 | Testing & Bug Fixes | HIGH |

---

## SHADCN/UI COMPONENTS TO ADD

```bash
# If not already installed
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add date-picker
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add chart
```

---

## TESTING CHECKLIST

- [ ] All CRUD operations work correctly
- [ ] Form validation matches backend Zod schemas
- [ ] Error handling displays user-friendly messages
- [ ] Loading states show properly
- [ ] Query invalidation works after mutations
- [ ] Zone-based filtering works for Location Admins
- [ ] Export downloads work correctly
- [ ] Real-time updates (WebSocket) if implemented

---

## NOTES

1. **Follow the Categories page pattern** for all new CRUD pages
2. **Always create types first** before implementing features
3. **Use query keys consistently** from the constants file
4. **Reset forms** when dialogs open using useEffect
5. **Show loading states** on all buttons during mutations
6. **Invalidate queries** after successful mutations

---

**Document Owner:** Development Team
**Created:** December 22, 2025
