import type {
  BulkOperationResult,
  BulkTaskDeleteRequest,
  BulkTaskStatusRequest,
  CreateTask,
  PagedResult,
  Task,
  TaskFilter,
  TaskStatistics,
  UpdateTask,
} from '../types'
import { apiClient } from './apiClient'

export interface OverdueTaskQuery {
  pageNumber?: number
  pageSize?: number
}

/** API sayfa başına en fazla 50 kayıt döndürür. */
const MAX_PAGE_SIZE = 50

/** Dışa aktarmanın tarayıcıyı kilitlememesi için üst sınır. */
const MAX_EXPORT_ITEMS = 1000

export interface CollectedTasks {
  items: Task[]
  /** Filtreye uyan toplam görev sayısı (üst sınırdan bağımsız). */
  totalCount: number
  /** Üst sınır nedeniyle sonuç kesildiyse `true`. */
  isTruncated: boolean
  limit: number
}

export const taskService = {
  async getAll(filter: TaskFilter = {}): Promise<PagedResult<Task>> {
    const response = await apiClient.get<PagedResult<Task>>('/Tasks', { params: filter })
    return response.data
  },

  async getById(taskId: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/Tasks/${encodeURIComponent(taskId)}`)
    return response.data
  },

  async create(request: CreateTask): Promise<Task> {
    const response = await apiClient.post<Task>('/Tasks', request)
    return response.data
  },

  async update(taskId: string, request: UpdateTask): Promise<Task> {
    const response = await apiClient.put<Task>(`/Tasks/${encodeURIComponent(taskId)}`, request)
    return response.data
  },

  async delete(taskId: string): Promise<void> {
    await apiClient.delete(`/Tasks/${encodeURIComponent(taskId)}`)
  },

  async getOverdue(query: OverdueTaskQuery = {}): Promise<PagedResult<Task>> {
    const response = await apiClient.get<PagedResult<Task>>('/Tasks/overdue', { params: query })
    return response.data
  },

  async getStatistics(): Promise<TaskStatistics> {
    const response = await apiClient.get<TaskStatistics>('/Tasks/statistics')
    return response.data
  },

  async bulkUpdateStatus(request: BulkTaskStatusRequest): Promise<BulkOperationResult> {
    const response = await apiClient.post<BulkOperationResult>('/Tasks/bulk/status', request)
    return response.data
  },

  async bulkDelete(request: BulkTaskDeleteRequest): Promise<BulkOperationResult> {
    const response = await apiClient.post<BulkOperationResult>('/Tasks/bulk/delete', request)
    return response.data
  },

  /**
   * Dışa aktarma ve yazdırma için aktif filtreye uyan görevleri sayfa sayfa toplar.
   * `overdueOnly` verildiğinde vadesi geçen görev ucu kullanılır. Üst sınır aşılırsa
   * sonuç sessizce kesilmez; `isTruncated` ile çağırana bildirilir.
   */
  async getAllMatching(
    filter: TaskFilter = {},
    overdueOnly = false,
  ): Promise<CollectedTasks> {
    const collected: Task[] = []
    let pageNumber = 1
    let totalPages = 1
    let totalCount = 0

    while (pageNumber <= totalPages && collected.length < MAX_EXPORT_ITEMS) {
      const page = overdueOnly
        ? await this.getOverdue({ pageNumber, pageSize: MAX_PAGE_SIZE })
        : await this.getAll({ ...filter, pageNumber, pageSize: MAX_PAGE_SIZE })

      collected.push(...page.items)
      totalPages = page.totalPages
      totalCount = page.totalCount
      if (page.items.length === 0) break
      pageNumber += 1
    }

    const items = collected.slice(0, MAX_EXPORT_ITEMS)

    return {
      items,
      totalCount: Math.max(totalCount, items.length),
      isTruncated: totalCount > items.length,
      limit: MAX_EXPORT_ITEMS,
    }
  },
}
