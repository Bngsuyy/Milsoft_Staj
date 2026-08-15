export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ApiError {
  statusCode: number
  message: string
  detailed: string | null
  traceId: string | null
}

export interface ValidationProblemDetails {
  type?: string
  title: string
  status: number
  errors: Record<string, string[]>
  traceId?: string
}
