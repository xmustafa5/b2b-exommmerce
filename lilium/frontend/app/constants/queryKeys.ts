export const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "list"] as const,
  list: (filters?: any) => [...productsQueryKeys.lists(), filters] as const,
  details: () => [...productsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
};

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesQueryKeys.all, "list"] as const,
  list: (filters?: any) => [...categoriesQueryKeys.lists(), filters] as const,
  details: () => [...categoriesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoriesQueryKeys.details(), id] as const,
};

export const ordersQueryKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersQueryKeys.all, "list"] as const,
  list: (filters?: any) => [...ordersQueryKeys.lists(), filters] as const,
  details: () => [...ordersQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...ordersQueryKeys.details(), id] as const,
};

export const usersQueryKeys = {
  all: ["users"] as const,
  lists: () => [...usersQueryKeys.all, "list"] as const,
  list: (filters?: any) => [...usersQueryKeys.lists(), filters] as const,
  details: () => [...usersQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...usersQueryKeys.details(), id] as const,
  profile: ["users", "profile"] as const,
};

export const authQueryKeys = {
  profile: ["auth", "profile"] as const,
  session: ["auth", "session"] as const,
};

export const dashboardQueryKeys = {
  stats: ["dashboard", "stats"] as const,
  recentOrders: ["dashboard", "recent-orders"] as const,
  topProducts: ["dashboard", "top-products"] as const,
};

export const promotionsQueryKeys = {
  all: ["promotions"] as const,
  lists: () => [...promotionsQueryKeys.all, "list"] as const,
  list: (filters?: any) => [...promotionsQueryKeys.lists(), filters] as const,
  details: () => [...promotionsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...promotionsQueryKeys.details(), id] as const,
  active: (zone?: string) => [...promotionsQueryKeys.all, "active", zone] as const,
  upcoming: () => [...promotionsQueryKeys.all, "upcoming"] as const,
  expired: () => [...promotionsQueryKeys.all, "expired"] as const,
};
