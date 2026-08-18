import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Toast } from 'primereact/toast'
import { PriorityTag, StatusTag, TaskFormDialog } from '../components'
import { TaskAttachmentsSection } from '../components/TaskAttachmentsSection'
import { TaskCommentsSection } from '../components/TaskCommentsSection'
import { useAuth } from '../hooks'
import { categoryService, taskService } from '../services'
import type { Category, Task } from '../types'
import {
  formatTaskDateTime,
  getApiErrorMessage,
  isTaskOverdue,
} from '../utils'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useRef<Toast>(null)
  const [task, setTask] = useState<Task | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadTask() {
      if (!id) {
        setLoadError('Görev kimliği bulunamadı.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        const taskResponse = await taskService.getById(id)
        let categoryResponse: Category[] = []

        try {
          categoryResponse = await categoryService.getAll()
        } catch {
          // Kategori listesi yüklenemese de görev detayı görüntülenebilir.
        }

        if (isActive) {
          setTask(taskResponse)
          setCategories(categoryResponse)
        }
      } catch (error) {
        if (isActive) {
          setLoadError(getApiErrorMessage(error, 'Görev detayı yüklenemedi.'))
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadTask()
    return () => {
      isActive = false
    }
  }, [id, refreshKey])

  async function deleteTask() {
    if (!task) return

    try {
      await taskService.delete(task.id)
      navigate('/tasks', { replace: true })
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Görev silinemedi',
        detail: getApiErrorMessage(error, 'Görev silinirken bir hata oluştu.'),
      })
    }
  }

  function requestDelete() {
    if (!task) return

    confirmDialog({
      header: 'Görevi sil',
      message: `“${task.title}” görevi kalıcı olarak silinsin mi?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, sil',
      rejectLabel: 'Vazgeç',
      acceptClassName: 'p-button-danger',
      accept: () => void deleteTask(),
    })
  }

  function handleSaved(savedTask: Task) {
    setTask(savedTask)
    setIsFormOpen(false)
    toast.current?.show({
      severity: 'success',
      summary: 'Görev güncellendi',
      detail: savedTask.title,
    })
  }

  function showNotification(
    severity: 'success' | 'error',
    summary: string,
    detail: string,
  ) {
    toast.current?.show({ severity, summary, detail })
  }

  if (isLoading) {
    return (
      <div className="content-page task-detail-state" aria-live="polite">
        <ProgressSpinner strokeWidth="4" />
        <p>Görev detayı yükleniyor...</p>
      </div>
    )
  }

  if (loadError || !task) {
    return (
      <div className="content-page">
        <Link className="back-link" to="/tasks">
          <i className="pi pi-arrow-left" aria-hidden="true" />
          Görevlere dön
        </Link>
        <section className="empty-state-card task-detail-error" role="alert">
          <span className="empty-state-icon" aria-hidden="true"><i className="pi pi-exclamation-circle" /></span>
          <h2>Görev yüklenemedi</h2>
          <p>{loadError ?? 'Görev bulunamadı.'}</p>
          <Button label="Tekrar dene" icon="pi pi-refresh" outlined onClick={() => setRefreshKey((current) => current + 1)} />
        </section>
      </div>
    )
  }

  return (
    <div className="content-page task-detail-page">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <Link className="back-link" to="/tasks">
        <i className="pi pi-arrow-left" aria-hidden="true" />
        Görevlere dön
      </Link>

      {isTaskOverdue(task) && (
        <div className="overdue-banner" role="status">
          <i className="pi pi-clock" aria-hidden="true" />
          <div>
            <strong>Bu görevin vadesi geçti</strong>
            <span>Son teslim tarihi {formatTaskDateTime(task.dueDate)} olarak belirlenmiş.</span>
          </div>
        </div>
      )}

      <article className="task-detail-card">
        <header className="task-detail-header">
          <div>
            <div className="task-detail-tags">
              <StatusTag status={task.status} />
              <PriorityTag priority={task.priority} />
            </div>
            <h2>{task.title}</h2>
            <span className="task-id">Görev no: {task.id}</span>
          </div>
          <div className="task-detail-actions">
            <Button label="Düzenle" icon="pi pi-pencil" outlined onClick={() => setIsFormOpen(true)} />
            <Button label="Sil" icon="pi pi-trash" severity="danger" outlined onClick={requestDelete} />
          </div>
        </header>

        <section className="task-description-section">
          <h3>Açıklama</h3>
          <p>{task.description || 'Bu görev için açıklama eklenmemiş.'}</p>
        </section>

        <dl className="task-detail-information">
          <div>
            <dt>Kategori</dt>
            <dd>
              {task.category ? (
                <span className="category-cell">
                  <span className="category-color" style={{ backgroundColor: task.category.color }} aria-hidden="true" />
                  {task.category.name}
                </span>
              ) : 'Kategorisiz'}
            </dd>
          </div>
          <div><dt>Son teslim tarihi</dt><dd>{formatTaskDateTime(task.dueDate)}</dd></div>
          <div><dt>Oluşturulma tarihi</dt><dd>{formatTaskDateTime(task.createdAt)}</dd></div>
          <div><dt>Tamamlanma tarihi</dt><dd>{formatTaskDateTime(task.completedAt)}</dd></div>
        </dl>
      </article>

      <div className="task-detail-workspace">
        <TaskCommentsSection
          taskId={task.id}
          currentUserId={user?.id}
          onNotify={showNotification}
        />
        <TaskAttachmentsSection
          taskId={task.id}
          onNotify={showNotification}
        />
      </div>

      {isFormOpen && (
        <TaskFormDialog
          key={task.id}
          categories={categories}
          task={task}
          onHide={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
