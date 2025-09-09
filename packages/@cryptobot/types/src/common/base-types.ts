export interface Timestamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface Identifiable {
  id: string;
}

// Simplified Decimal type for practical use
export type Decimal = string;

export interface Price {
  value: Decimal;
  currency: string;
}

export interface Volume {
  value: Decimal;
  currency: string;
}

export interface Percentage {
  value: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  statusCode: number;
}