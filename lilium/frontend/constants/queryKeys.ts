// Query Keys for React Query - organized by entity
// Following hierarchical structure for easy cache invalidation

export const authQueryKeys = {
  all: ["auth"] as const,
  profile: ["auth", "profile"] as const,
  session: ["auth", "session"] as const,
};

export const productsQueryKeys = {
  all: ["products"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["products", "list", filters] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  byVendor: (vendorId: string) => ["products", "byVendor", vendorId] as const,
  byCategory: (categoryId: string) =>
    ["products", "byCategory", categoryId] as const,
};

export const ordersQueryKeys = {
  all: ["orders"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  byShop: (shopId: string) => ["orders", "byShop", shopId] as const,
  byVendor: (vendorId: string) => ["orders", "byVendor", vendorId] as const,
  stats: () => ["orders", "stats"] as const,
};

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["categories", "list", filters] as const,
  detail: (id: string) => ["categories", "detail", id] as const,
  tree: () => ["categories", "tree"] as const,
};

export const companiesQueryKeys = {
  all: ["companies"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["companies", "list", filters] as const,
  detail: (id: string) => ["companies", "detail", id] as const,
};

export const vendorsQueryKeys = {
  all: ["vendors"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["vendors", "list", filters] as const,
  detail: (id: string) => ["vendors", "detail", id] as const,
};

export const shopsQueryKeys = {
  all: ["shops"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["shops", "list", filters] as const,
  detail: (id: string) => ["shops", "detail", id] as const,
  byCompany: (companyId: string) => ["shops", "byCompany", companyId] as const,
};

export const usersQueryKeys = {
  all: ["users"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["users", "list", filters] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export const deliveriesQueryKeys = {
  all: ["deliveries"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["deliveries", "list", filters] as const,
  detail: (id: string) => ["deliveries", "detail", id] as const,
  byDriver: (driverId: string) =>
    ["deliveries", "byDriver", driverId] as const,
};

export const driversQueryKeys = {
  all: ["drivers"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["drivers", "list", filters] as const,
  detail: (id: string) => ["drivers", "detail", id] as const,
  available: () => ["drivers", "available"] as const,
};

export const settlementsQueryKeys = {
  all: ["settlements"] as const,
  list: (filters?: Record<string, unknown>) =>
    ["settlements", "list", filters] as const,
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
