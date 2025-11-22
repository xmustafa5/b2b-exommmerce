export * from "./auth";
export * from "./product";
export * from "./order";
export * from "./category";
export * from "./company";
export * from "./vendor";
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
