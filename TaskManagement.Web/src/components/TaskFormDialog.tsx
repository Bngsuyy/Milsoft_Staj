import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { taskService } from '../services'
import { Priority, TaskStatus } from '../types'
import type { Category, Task } from '../types'
import { getApiErrorMessage, priorityOptions, statusOptions } from '../utils'

interface TaskFormDialogProps {
  categories: Category[]
  task?: Task | null
  onHide: () => void
  onSaved: (task: Task) => void
}

interface TaskFormState {
  title: string
  description: string
  priority: Priority
  status: TaskStatus
  dueDate: Date | null
  categoryId: string | null
}

function getInitialForm(task?: Task | null): TaskFormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? Priority.Normal,
    status: task?.status ?? TaskStatus.Pending,
    dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    categoryId: task?.category?.id ?? null,
  }
}

export function TaskFormDialog({ categories, task, onHide, onSaved }: TaskFormDialogProps) {
  const [form, setForm] = useState(() => getInitialForm(task))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(task)

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = form.title.trim()
    const description = form.description.trim()

    if (!title) {
      setValidationError('Görev başlığı zorunludur.')
      return
    }

    if (title.length > 200) {
      setValidationError('Görev başlığı en fazla 200 karakter olabilir.')
      return
    }

    if (description.length > 2000) {
      setValidationError('Açıklama en fazla 2000 karakter olabilir.')
      return
    }

    setValidationError(null)
    setIsSubmitting(true)

    try {
      const commonRequest = {
        title,
        description: description || null,
        priority: form.priority,
        dueDate: form.dueDate?.toISOString() ?? null,
        categoryId: form.categoryId,
      }

      const savedTask = task
        ? await taskService.update(task.id, { ...commonRequest, status: form.status })
        : await taskService.create(commonRequest)

      onSaved(savedTask)
    } catch (error) {
      setValidationError(getApiErrorMessage(error, 'Görev kaydedilemedi.'))
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      className="task-form-dialog"
      header={isEditing ? 'Görevi düzenle' : 'Yeni görev oluştur'}
      visible
      modal
      draggable={false}
      closable={!isSubmitting}
      closeOnEscape={!isSubmitting}
      style={{ width: '42rem' }}
      breakpoints={{ '760px': 'calc(100vw - 2rem)' }}
      onHide={onHide}
    >
      <form className="task-form" onSubmit={handleSubmit} noValidate>
        {validationError && (
          <div className="task-form-error full-width-field" role="alert">
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="task-form-field full-width-field">
          <label htmlFor="task-title">Başlık <span aria-hidden="true">*</span></label>
          <InputText
            id="task-title"
            value={form.title}
            maxLength={200}
            autoFocus
            aria-invalid={Boolean(validationError && !form.title.trim())}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <small>{form.title.length}/200</small>
        </div>

        <div className="task-form-field full-width-field">
          <label htmlFor="task-description">Açıklama</label>
          <InputTextarea
            id="task-description"
            value={form.description}
            rows={5}
            maxLength={2000}
            autoResize
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <small>{form.description.length}/2000</small>
        </div>

        <div className="task-form-field">
          <label htmlFor="task-priority">Öncelik</label>
          <Dropdown
            inputId="task-priority"
            value={form.priority}
            options={priorityOptions}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.value as Priority }))}
          />
        </div>

        {isEditing && (
          <div className="task-form-field">
            <label htmlFor="task-status">Durum</label>
            <Dropdown
              inputId="task-status"
              value={form.status}
              options={statusOptions}
              onChange={(event) => setForm((current) => ({ ...current, status: event.value as TaskStatus }))}
            />
          </div>
        )}

        <div className="task-form-field">
          <label htmlFor="task-category">Kategori</label>
          <Dropdown
            inputId="task-category"
            value={form.categoryId}
            options={categoryOptions}
            placeholder="Kategori seç"
            emptyMessage="Kategori bulunamadı"
            showClear
            onChange={(event) => setForm((current) => ({ ...current, categoryId: event.value ?? null }))}
          />
        </div>

        <div className="task-form-field">
          <label htmlFor="task-due-date">Son teslim tarihi</label>
          <Calendar
            inputId="task-due-date"
            value={form.dueDate}
            dateFormat="dd.mm.yy"
            placeholder="Tarih seç"
            showIcon
            showButtonBar
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.value as Date | null }))}
          />
        </div>

        <div className="task-form-actions full-width-field">
          <Button
            type="button"
            label="Vazgeç"
            severity="secondary"
            outlined
            disabled={isSubmitting}
            onClick={onHide}
          />
          <Button
            type="submit"
            label={isEditing ? 'Değişiklikleri kaydet' : 'Görevi oluştur'}
            icon="pi pi-check"
            loading={isSubmitting}
          />
        </div>
      </form>
    </Dialog>
  )
}
