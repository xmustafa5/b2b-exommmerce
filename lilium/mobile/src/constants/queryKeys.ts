/**
 * React Query Keys for the Lilium B2B Mobile App
 * Following the factory pattern for consistent key management
 */

export const authQueryKeys = {
  all: ['auth'] as const,
  profile: () => [...authQueryKeys.all, 'profile'] as const,
  session: () => [...authQueryKeys.all, 'session'] as const,
};

export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (filters?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    zones?: string[];
  }) => [...productsQueryKeys.lists(), filters] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
  featured: (zones?: string[]) => [...productsQueryKeys.all, 'featured', zones] as const,
};

export const ordersQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersQueryKeys.all, 'list'] as const,
  list: (filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => [...ordersQueryKeys.lists(), filters] as const,
  details: () => [...ordersQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...ordersQueryKeys.details(), id] as const,
};

export const categoriesQueryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesQueryKeys.all, 'list'] as const,
  list: (filters?: { isActive?: boolean }) => [...categoriesQueryKeys.lists(), filters] as const,
  details: () => [...categoriesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoriesQueryKeys.details(), id] as const,
};

export const notificationsQueryKeys = {
  all: ['notifications'] as const,
  status: () => [...notificationsQueryKeys.all, 'status'] as const,
};

export const cartQueryKeys = {
  all: ['cart'] as const,
  items: () => [...cartQueryKeys.all, 'items'] as const,
  summary: () => [...cartQueryKeys.all, 'summary'] as const,
  validation: () => [...cartQueryKeys.all, 'validation'] as const,
};

export const favoritesQueryKeys = {
  all: ['favorites'] as const,
  list: () => [...favoritesQueryKeys.all, 'list'] as const,
  check: (productId: string) => [...favoritesQueryKeys.all, 'check', productId] as const,
};

export const notifyMeQueryKeys = {
  all: ['notifyMe'] as const,
  subscriptions: () => [...notifyMeQueryKeys.all, 'subscriptions'] as const,
  check: (productId: string) => [...notifyMeQueryKeys.all, 'check', productId] as const,
};

export const promotionsQueryKeys = {
  all: ['promotions'] as const,
  active: () => [...promotionsQueryKeys.all, 'active'] as const,
  detail: (id: string) => [...promotionsQueryKeys.all, 'detail', id] as const,
  preview: () => [...promotionsQueryKeys.all, 'preview'] as const,
};

export const addressesQueryKeys = {
  all: ['addresses'] as const,
  list: () => [...addressesQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...addressesQueryKeys.all, 'detail', id] as const,
  default: () => [...addressesQueryKeys.all, 'default'] as const,
};

export const companiesQueryKeys = {
  all: ['companies'] as const,
  lists: () => [...companiesQueryKeys.all, 'list'] as const,
  list: (filters?: { zone?: string; isActive?: boolean }) => [...companiesQueryKeys.lists(), filters] as const,
  details: () => [...companiesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...companiesQueryKeys.details(), id] as const,
  byZone: (zone: string) => [...companiesQueryKeys.all, 'zone', zone] as const,
  products: (id: string, params?: { page?: number; limit?: number }) => [...companiesQueryKeys.all, 'products', id, params] as const,
};
