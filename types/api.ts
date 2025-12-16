export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  statusCode?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface CreateResponse<T> extends ApiResponse<T> {
  message: string;
}

export interface UpdateResponse<T> extends ApiResponse<T> {
  message: string;
}

export interface DeleteResponse extends ApiResponse<null> {
  message: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}
