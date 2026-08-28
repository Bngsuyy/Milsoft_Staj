import type { EntityId, IsoDateString } from './common'

export interface Category {
  id: EntityId
  name: string
  description: string | null
  color: string
  icon?: string | null
  imageUrl?: string | null
  taskCount?: number
  createdAt: IsoDateString
}

export interface CreateCategory {
  name: string
  description?: string | null
  color: string
  icon?: string | null
  imageUrl?: string | null
}

export type UpdateCategory = CreateCategory
