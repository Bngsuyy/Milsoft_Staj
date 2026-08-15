import type { AxiosProgressEvent } from 'axios'
import type { TaskAttachment } from '../types'
import { apiClient } from './apiClient'

export interface UploadAttachmentOptions {
  onProgress?: (percentage: number) => void
}

function attachmentsPath(taskId: string): string {
  return `/tasks/${encodeURIComponent(taskId)}/attachments`
}

function calculateProgress(event: AxiosProgressEvent): number {
  if (!event.total) {
    return 0
  }

  return Math.min(100, Math.round((event.loaded * 100) / event.total))
}

export const attachmentService = {
  async getAll(taskId: string): Promise<TaskAttachment[]> {
    const response = await apiClient.get<TaskAttachment[]>(attachmentsPath(taskId))
    return response.data
  },

  async upload(
    taskId: string,
    file: File,
    options: UploadAttachmentOptions = {},
  ): Promise<TaskAttachment> {
    const formData = new FormData()
    formData.append('file', file, file.name)

    const response = await apiClient.post<TaskAttachment>(attachmentsPath(taskId), formData, {
      onUploadProgress: (event) => options.onProgress?.(calculateProgress(event)),
    })

    return response.data
  },

  async download(taskId: string, attachmentId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `${attachmentsPath(taskId)}/${encodeURIComponent(attachmentId)}/download`,
      { responseType: 'blob' },
    )
    return response.data
  },

  async delete(taskId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(
      `${attachmentsPath(taskId)}/${encodeURIComponent(attachmentId)}`,
    )
  },
}
