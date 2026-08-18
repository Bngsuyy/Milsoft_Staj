import type { EntityId, IsoDateString } from './common'

export interface TaskAttachment {
  id: EntityId
  taskId: EntityId
  fileName: string
  fileSize: number
  contentType: string
  uploadedAt: IsoDateString
}
