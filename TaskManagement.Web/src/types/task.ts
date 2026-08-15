import type { Category } from './category'
import type { EntityId, IsoDateString } from './common'
import type { Priority, TaskStatus } from './enums'

export interface Task {
  id: EntityId
  title: string
  description: string | null
  priority: Priority
  status: TaskStatus
  dueDate: IsoDateString | null
  completedAt: IsoDateString | null
  createdAt: IsoDateString
  userId: EntityId
  category: Category | null
}

export interface CreateTask {
  title: string
  description?: string | null
  priority: Priority
  dueDate?: IsoDateString | null
  categoryId?: EntityId | null
}

export interface UpdateTask {
  title: string
  description?: string | null
  priority: Priority
  status: TaskStatus
  dueDate?: IsoDateString | null
  categoryId?: EntityId | null
}

export interface TaskFilter {
  searchTerm?: string
  status?: TaskStatus
  priority?: Priority
  categoryId?: EntityId
  startDate?: IsoDateString
  endDate?: IsoDateString
  pageNumber?: number
  pageSize?: number
}

export interface TaskStatistics {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
  overdue: number
}
