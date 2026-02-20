export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiErrorShape {
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  page: number;
  totalPages: number;
  totalItems: number;
  items: T[];
}
