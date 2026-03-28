/** Standard API envelope returned by every backend endpoint */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>; // field-level validation errors
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Auth
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;  // presigned GCS PUT URL
  assetId: string;    // pre-created Asset record ID
}
