import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '../services/apiClient'
import { attachmentService } from '../services/attachmentService'
import { commentService } from '../services/commentService'
import { taskService } from '../services/taskService'
import { tokenStorage } from '../services/tokenStorage'
import { Priority, TaskStatus } from '../types'
import type { PagedResult, Task } from '../types'

const task: Task = {
  id: 'task-1',
  title: 'Entegrasyon görevi',
  description: null,
  priority: Priority.Normal,
  status: TaskStatus.Pending,
  dueDate: null,
  completedAt: null,
  createdAt: '2026-08-16T10:00:00Z',
  userId: 'user-1',
  category: null,
}

describe('API servis entegrasyonu', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
    tokenStorage.set('test-jwt-token')
  })

  afterEach(() => {
    mock.restore()
    tokenStorage.clear()
  })

  it('JWT ve filtreleri görev listeleme isteğine ekler', async () => {
    const response: PagedResult<Task> = {
      items: [task],
      totalCount: 1,
      pageNumber: 2,
      pageSize: 5,
      totalPages: 1,
      hasPreviousPage: true,
      hasNextPage: false,
    }

    mock.onGet('/Tasks').reply((config) => {
      expect(config.params).toEqual({
        searchTerm: 'entegrasyon',
        status: TaskStatus.Pending,
        pageNumber: 2,
        pageSize: 5,
      })
      expect(config.headers?.Authorization).toBe('Bearer test-jwt-token')
      return [200, response]
    })

    const result = await taskService.getAll({
      searchTerm: 'entegrasyon',
      status: TaskStatus.Pending,
      pageNumber: 2,
      pageSize: 5,
    })

    expect(result).toEqual(response)
  })

  it('yorum endpointlerinin istek ve yanıt sözleşmesini korur', async () => {
    const comment = {
      id: 'comment-1',
      taskId: task.id,
      userId: task.userId,
      username: 'demouser',
      comment: 'Test yorumu',
      createdAt: '2026-08-16T10:05:00Z',
    }

    mock.onPost(`/tasks/${task.id}/comments`).reply((config) => {
      expect(JSON.parse(config.data as string)).toEqual({ comment: 'Test yorumu' })
      return [201, comment]
    })
    mock.onDelete(`/tasks/${task.id}/comments/${comment.id}`).reply(204)

    await expect(commentService.create(task.id, { comment: 'Test yorumu' })).resolves.toEqual(comment)
    await expect(commentService.delete(task.id, comment.id)).resolves.toBeUndefined()
  })

  it('dosya yükleme, indirme ve silme isteklerini doğru gönderir', async () => {
    const file = new File(['test içeriği'], 'test.txt', { type: 'text/plain' })
    const attachment = {
      id: 'attachment-1',
      taskId: task.id,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      uploadedAt: '2026-08-16T10:10:00Z',
    }

    mock.onPost(`/tasks/${task.id}/attachments`).reply((config) => {
      expect(config.data).toBeInstanceOf(FormData)
      expect((config.data as FormData).get('file')).toBeInstanceOf(File)
      return [201, attachment]
    })
    mock.onGet(`/tasks/${task.id}/attachments/${attachment.id}/download`).reply((config) => {
      expect(config.responseType).toBe('blob')
      return [200, new Blob(['test içeriği'], { type: 'text/plain' })]
    })
    mock.onDelete(`/tasks/${task.id}/attachments/${attachment.id}`).reply(204)

    await expect(attachmentService.upload(task.id, file)).resolves.toEqual(attachment)
    await expect(attachmentService.download(task.id, attachment.id)).resolves.toBeInstanceOf(Blob)
    await expect(attachmentService.delete(task.id, attachment.id)).resolves.toBeUndefined()
  })
})
