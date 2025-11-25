// Query Keys for React Query - organized by entity
// Following hierarchical structure for easy cache invalidation

export const authQueryKeys = {
  all: ["auth"] as const,
  profile: ["auth", "profile"] as const,
  session: ["auth", "session"] as const,
};

export const productsQueryKeys = {
  all: ["products"] as const,
  list: (...args: any[]) => ["products", "list", ...args] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  featured: (zones?: string) => ["products", "featured", zones] as const,
  byCategory: (categoryId: string, zones?: string) =>
    ["products", "byCategory", categoryId, zones] as const,
};

export const ordersQueryKeys = {
  all: ["orders"] as const,
  list: (...args: any[]) => ["orders", "list", ...args] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  byShop: (shopId: string) => ["orders", "byShop", shopId] as const,
  byVendor: (vendorId: string) => ["orders", "byVendor", vendorId] as const,
  stats: () => ["orders", "stats"] as const,
};

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  list: (...args: any[]) => ["categories", "list", ...args] as const,
  detail: (id: string) => ["categories", "detail", id] as const,
  stats: () => ["categories", "stats"] as const,
};

export const companiesQueryKeys = {
  all: ["companies"] as const,
  list: (...args: any[]) => ["companies", "list", ...args] as const,
  detail: (id: string) => ["companies", "detail", id] as const,
  stats: (id: string) => ["companies", "stats", id] as const,
  vendors: (id: string) => ["companies", "vendors", id] as const,
  products: (id: string) => ["companies", "products", id] as const,
  byZone: (zone: string) => ["companies", "byZone", zone] as const,
  payouts: (id: string, startDate: string, endDate: string) =>
    ["companies", "payouts", id, startDate, endDate] as const,
};

export const vendorsQueryKeys = {
  all: ["vendors"] as const,
  company: ["vendors", "company"] as const,
  stats: ["vendors", "stats"] as const,
  products: {
    all: ["vendors", "products"] as const,
    list: (...args: any[]) => ["vendors", "products", "list", ...args] as const,
    detail: (id: string) => ["vendors", "products", "detail", id] as const,
  },
  orders: {
    all: ["vendors", "orders"] as const,
    list: (...args: any[]) => ["vendors", "orders", "list", ...args] as const,
    detail: (id: string) => ["vendors", "orders", "detail", id] as const,
  },
  customers: {
    all: ["vendors", "customers"] as const,
    list: (...args: any[]) => ["vendors", "customers", "list", ...args] as const,
  },
  export: (type: string, format: string) => ["vendors", "export", type, format] as const,
};

export const shopsQueryKeys = {
  all: ["shops"] as const,
  list: (...args: any[]) => ["shops", "list", ...args] as const,
  detail: (id: string) => ["shops", "detail", id] as const,
  byCompany: (companyId: string) => ["shops", "byCompany", companyId] as const,
};

export const usersQueryKeys = {
  all: ["users"] as const,
  list: (...args: any[]) => ["users", "list", ...args] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export const deliveriesQueryKeys = {
  all: ["deliveries"] as const,
  list: (...args: any[]) => ["deliveries", "list", ...args] as const,
  detail: (id: string) => ["deliveries", "detail", id] as const,
  byDriver: (driverId: string) =>
    ["deliveries", "byDriver", driverId] as const,
};

export const driversQueryKeys = {
  all: ["drivers"] as const,
  list: (...args: any[]) => ["drivers", "list", ...args] as const,
  detail: (id: string) => ["drivers", "detail", id] as const,
  available: () => ["drivers", "available"] as const,
};

export const settlementsQueryKeys = {
  all: ["settlements"] as const,
  list: (...args: any[]) => ["settlements", "list", ...args] as const,
  detail: (id: string) => ["settlements", "detail", id] as const,
  byVendor: (vendorId: string) =>
    ["settlements", "byVendor", vendorId] as const,
};

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
  recentOrders: () => ["dashboard", "recentOrders"] as const,
  salesChart: (period: string) => ["dashboard", "salesChart", period] as const,
};
