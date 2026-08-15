import type { Category, CreateCategory, UpdateCategory } from '../types'
import { apiClient } from './apiClient'

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/Categories')
    return response.data
  },

  async getById(categoryId: string): Promise<Category> {
    const response = await apiClient.get<Category>(
      `/Categories/${encodeURIComponent(categoryId)}`,
    )
    return response.data
  },

  async create(request: CreateCategory): Promise<Category> {
    const response = await apiClient.post<Category>('/Categories', request)
    return response.data
  },

  async update(categoryId: string, request: UpdateCategory): Promise<Category> {
    const response = await apiClient.put<Category>(
      `/Categories/${encodeURIComponent(categoryId)}`,
      request,
    )
    return response.data
  },

  async delete(categoryId: string): Promise<void> {
    await apiClient.delete(`/Categories/${encodeURIComponent(categoryId)}`)
  },
}
