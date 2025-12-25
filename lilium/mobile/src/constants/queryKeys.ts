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
};
