import type { EntityId, IsoDateString } from './common'

export interface Category {
  id: EntityId
  name: string
  description: string | null
  color: string
  taskCount?: number
  createdAt: IsoDateString
}

export interface CreateCategory {
  name: string
  description?: string | null
  color: string
}

export type UpdateCategory = CreateCategory
