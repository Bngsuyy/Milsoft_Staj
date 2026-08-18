import type { CreateTaskComment, TaskComment } from '../types'
import { apiClient } from './apiClient'

function commentsPath(taskId: string): string {
  return `/tasks/${encodeURIComponent(taskId)}/comments`
}

export const commentService = {
  async getAll(taskId: string): Promise<TaskComment[]> {
    const response = await apiClient.get<TaskComment[]>(commentsPath(taskId))
    return response.data
  },

  async create(taskId: string, request: CreateTaskComment): Promise<TaskComment> {
    const response = await apiClient.post<TaskComment>(commentsPath(taskId), request)
    return response.data
  },

  async delete(taskId: string, commentId: string): Promise<void> {
    await apiClient.delete(
      `${commentsPath(taskId)}/${encodeURIComponent(commentId)}`,
    )
  },
}
