import { Tag } from 'primereact/tag'
import type { Priority, TaskStatus } from '../types'
import {
  getPriorityLabel,
  getPrioritySeverity,
  getStatusLabel,
  getStatusSeverity,
} from '../utils'

export function PriorityTag({ priority }: { priority: Priority }) {
  return <Tag severity={getPrioritySeverity(priority)} value={getPriorityLabel(priority)} />
}

export function StatusTag({ status }: { status: TaskStatus }) {
  return <Tag severity={getStatusSeverity(status)} value={getStatusLabel(status)} />
}
