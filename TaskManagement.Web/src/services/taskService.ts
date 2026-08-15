import type {
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
}
