/**
 * TypeScript enum yerine `as const` kullanılır; böylece API'ye string değer
 * gönderilir ve projenin `erasableSyntaxOnly` ayarı korunur.
 */
export const Priority = {
  Low: 'Low',
  Normal: 'Normal',
  High: 'High',
  Urgent: 'Urgent',
  Critical: 'Critical',
} as const

export type Priority = (typeof Priority)[keyof typeof Priority]

export const TaskStatus = {
  Pending: 'Pending',
  InProgress: 'InProgress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
} as const

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]
