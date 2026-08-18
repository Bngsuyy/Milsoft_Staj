import { useState } from 'react'
import type { DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { PriorityTag } from './TaskTags'
import { TaskStatus } from '../types'
import type { Task } from '../types'
import { formatTaskDate, isTaskOverdue, statusOptions } from '../utils'

interface TaskBoardProps {
  tasks: Task[]
  isLoading: boolean
  /** Kart yeni bir sütuna bırakıldığında çağrılır. */
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void> | void
  onEdit: (task: Task) => void
}

const boardColumns = statusOptions.map((option) => ({
  status: option.value,
  label: option.label,
}))

const DRAG_DATA_TYPE = 'text/task-id'

export function TaskBoard({ tasks, isLoading, onStatusChange, onEdit }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null)

  function handleDragStart(event: DragEvent<HTMLElement>, task: Task) {
    event.dataTransfer.setData(DRAG_DATA_TYPE, task.id)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedTaskId(task.id)
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault()
    setActiveColumn(null)

    const taskId = event.dataTransfer.getData(DRAG_DATA_TYPE) || draggedTaskId
    setDraggedTaskId(null)
    if (!taskId) return

    const task = tasks.find((item) => item.id === taskId)
    if (!task || task.status === status) return

    void onStatusChange(task, status)
  }

  return (
    <section className="task-board" aria-label="Görev panosu">
      {boardColumns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status)

        return (
          <div
            className={`task-board-column${activeColumn === column.status ? ' is-drop-target' : ''}`}
            key={column.status}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setActiveColumn(column.status)
            }}
            onDragLeave={(event) => {
              const nextTarget = event.relatedTarget
              if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                setActiveColumn(null)
              }
            }}
            onDrop={(event) => handleDrop(event, column.status)}
          >
            <header className={`task-board-heading status-${column.status.toLowerCase()}`}>
              <span>{column.label}</span>
              <strong>{columnTasks.length}</strong>
            </header>

            <div className="task-board-cards">
              {isLoading && <p className="task-board-hint">Yükleniyor...</p>}

              {!isLoading && columnTasks.length === 0 && (
                <p className="task-board-hint">Kartı buraya sürükleyin</p>
              )}

              {!isLoading && columnTasks.map((task) => (
                <article
                  className={`task-board-card${draggedTaskId === task.id ? ' is-dragging' : ''}${isTaskOverdue(task) ? ' is-overdue' : ''}`}
                  key={task.id}
                  draggable
                  tabIndex={0}
                  role="button"
                  aria-label={`${task.title} görevini düzenle`}
                  onDragStart={(event) => handleDragStart(event, task)}
                  onDragEnd={() => {
                    setDraggedTaskId(null)
                    setActiveColumn(null)
                  }}
                  onDoubleClick={() => onEdit(task)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onEdit(task)
                  }}
                >
                  <Link to={`/tasks/${task.id}`} onClick={(event) => event.stopPropagation()}>
                    {task.title}
                  </Link>
                  <div className="task-board-card-meta">
                    <PriorityTag priority={task.priority} />
                    {task.category && (
                      <span className="category-cell">
                        <span
                          className="category-color"
                          style={{ backgroundColor: task.category.color }}
                          aria-hidden="true"
                        />
                        {task.category.name}
                      </span>
                    )}
                  </div>
                  <footer>
                    <span>{formatTaskDate(task.dueDate)}</span>
                    {isTaskOverdue(task) && <small>Vadesi geçti</small>}
                  </footer>
                </article>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
