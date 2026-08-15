import type { EntityId, IsoDateString } from './common'

export interface TaskComment {
  id: EntityId
  taskId: EntityId
  userId: EntityId
  username: string
  comment: string
  createdAt: IsoDateString
}

export interface CreateTaskComment {
  comment: string
}
