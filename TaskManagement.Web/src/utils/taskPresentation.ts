import { Priority, TaskStatus } from '../types'
import type { Task } from '../types'

export const priorityOptions = [
  { label: 'Düşük', value: Priority.Low },
  { label: 'Normal', value: Priority.Normal },
  { label: 'Yüksek', value: Priority.High },
  { label: 'Acil', value: Priority.Urgent },
  { label: 'Kritik', value: Priority.Critical },
]

export const statusOptions = [
  { label: 'Bekliyor', value: TaskStatus.Pending },
  { label: 'Devam ediyor', value: TaskStatus.InProgress },
  { label: 'Tamamlandı', value: TaskStatus.Completed },
  { label: 'İptal edildi', value: TaskStatus.Cancelled },
]

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function getPriorityLabel(priority: Priority): string {
  return priorityOptions.find((option) => option.value === priority)?.label ?? priority
}

export function getStatusLabel(status: TaskStatus): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

export function getPrioritySeverity(priority: Priority) {
  if (priority === Priority.Low) return 'secondary' as const
  if (priority === Priority.Normal) return 'info' as const
  if (priority === Priority.High) return 'warning' as const
  return 'danger' as const
}

export function getStatusSeverity(status: TaskStatus) {
  if (status === TaskStatus.Completed) return 'success' as const
  if (status === TaskStatus.InProgress) return 'info' as const
  if (status === TaskStatus.Cancelled) return 'secondary' as const
  return 'warning' as const
}

export function formatTaskDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

export function formatTaskDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : '—'
}

export function isTaskOverdue(task: Task): boolean {
  return Boolean(
    task.dueDate
      && new Date(task.dueDate).getTime() < Date.now()
      && task.status !== TaskStatus.Completed
      && task.status !== TaskStatus.Cancelled,
  )
}
