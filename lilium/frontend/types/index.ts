export * from "./auth";
export * from "./product";
export * from "./order";
export * from "./category";
export * from "./company";
// Note: vendor types are not exported through index to avoid Zone/OrderStatus conflicts
// Import vendor types directly from @/types/vendor when needed
export * from "./shop";
export * from "./delivery";

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
