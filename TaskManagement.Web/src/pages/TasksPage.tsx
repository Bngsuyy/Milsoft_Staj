import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { DataTable } from 'primereact/datatable'
import type { DataTablePageEvent } from 'primereact/datatable'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { PriorityTag, StatusTag, TaskFormDialog } from '../components'
import { categoryService, taskService } from '../services'
import type { Category, PagedResult, Priority, Task, TaskStatus } from '../types'
import {
  formatTaskDate,
  getApiErrorMessage,
  isTaskOverdue,
  priorityOptions,
  statusOptions,
} from '../utils'

const emptyResult: PagedResult<Task> = {
  items: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
}

function toStartOfDay(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined
}

function toEndOfDay(value: string): string | undefined {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined
}

export function TasksPage() {
  const toast = useRef<Toast>(null)
  const [result, setResult] = useState<PagedResult<Task>>(emptyResult)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | null>(null)
  const [priority, setPriority] = useState<Priority | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isOverdueOnly, setIsOverdueOnly] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim())
      setPageNumber(1)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    let isActive = true

    async function loadCategories() {
      try {
        const response = await categoryService.getAll()
        if (isActive) setCategories(response)
      } catch (error) {
        if (isActive) {
          toast.current?.show({
            severity: 'warn',
            summary: 'Kategoriler yüklenemedi',
            detail: getApiErrorMessage(error, 'Kategori listesi alınamadı.'),
          })
        }
      }
    }

    void loadCategories()
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadTasks() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = isOverdueOnly
          ? await taskService.getOverdue({ pageNumber, pageSize })
          : await taskService.getAll({
              searchTerm: debouncedSearch || undefined,
              status: status ?? undefined,
              priority: priority ?? undefined,
              categoryId: categoryId ?? undefined,
              startDate: toStartOfDay(startDate),
              endDate: toEndOfDay(endDate),
              pageNumber,
              pageSize,
            })

        if (isActive) setResult(response)
      } catch (error) {
        if (isActive) {
          setLoadError(getApiErrorMessage(error, 'Görevler yüklenemedi.'))
          setResult(emptyResult)
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadTasks()
    return () => {
      isActive = false
    }
  }, [
    categoryId,
    debouncedSearch,
    endDate,
    isOverdueOnly,
    pageNumber,
    pageSize,
    priority,
    refreshKey,
    startDate,
    status,
  ])

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }))
  const hasFilters = Boolean(
    searchText || status || priority || categoryId || startDate || endDate,
  )

  function openCreateDialog() {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  function openEditDialog(task: Task) {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  function handleSaved(savedTask: Task) {
    setIsFormOpen(false)
    setEditingTask(null)
    setRefreshKey((current) => current + 1)
    toast.current?.show({
      severity: 'success',
      summary: editingTask ? 'Görev güncellendi' : 'Görev oluşturuldu',
      detail: savedTask.title,
    })
  }

  async function deleteTask(task: Task) {
    try {
      await taskService.delete(task.id)
      toast.current?.show({
        severity: 'success',
        summary: 'Görev silindi',
        detail: task.title,
      })

      if (result.items.length === 1 && pageNumber > 1) {
        setPageNumber((current) => current - 1)
      } else {
        setRefreshKey((current) => current + 1)
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Görev silinemedi',
        detail: getApiErrorMessage(error, 'Görev silinirken bir hata oluştu.'),
      })
    }
  }

  function requestDelete(task: Task) {
    confirmDialog({
      header: 'Görevi sil',
      message: `“${task.title}” görevi kalıcı olarak silinsin mi?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, sil',
      rejectLabel: 'Vazgeç',
      acceptClassName: 'p-button-danger',
      accept: () => void deleteTask(task),
    })
  }

  function resetFilters() {
    setSearchText('')
    setDebouncedSearch('')
    setStatus(null)
    setPriority(null)
    setCategoryId(null)
    setStartDate('')
    setEndDate('')
    setPageNumber(1)
  }

  function toggleOverdue() {
    setIsOverdueOnly((current) => !current)
    resetFilters()
  }

  function handlePage(event: DataTablePageEvent) {
    setPageNumber((event.page ?? 0) + 1)
    setPageSize(event.rows)
  }

  const titleTemplate = (task: Task) => (
    <div className="task-title-cell">
      <Link to={`/tasks/${task.id}`}>{task.title}</Link>
      {task.description && <span>{task.description}</span>}
    </div>
  )

  const categoryTemplate = (task: Task) => task.category ? (
    <span className="category-cell">
      <span className="category-color" style={{ backgroundColor: task.category.color }} aria-hidden="true" />
      {task.category.name}
    </span>
  ) : <span className="muted-cell">Kategorisiz</span>

  const dueDateTemplate = (task: Task) => (
    <div className={`due-date-cell${isTaskOverdue(task) ? ' is-overdue' : ''}`}>
      <span>{formatTaskDate(task.dueDate)}</span>
      {isTaskOverdue(task) && <small>Vadesi geçti</small>}
    </div>
  )

  const actionsTemplate = (task: Task) => (
    <div className="table-actions">
      <Link className="table-icon-link" to={`/tasks/${task.id}`} aria-label={`${task.title} detayını aç`} title="Detay">
        <i className="pi pi-eye" aria-hidden="true" />
      </Link>
      <Button
        type="button"
        icon="pi pi-pencil"
        rounded
        text
        severity="secondary"
        aria-label={`${task.title} görevini düzenle`}
        tooltip="Düzenle"
        tooltipOptions={{ position: 'top' }}
        onClick={() => openEditDialog(task)}
      />
      <Button
        type="button"
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        aria-label={`${task.title} görevini sil`}
        tooltip="Sil"
        tooltipOptions={{ position: 'top' }}
        onClick={() => requestDelete(task)}
      />
    </div>
  )

  return (
    <div className="content-page tasks-page">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <section className="section-heading page-heading">
        <div>
          <span className="page-eyebrow">Görev yönetimi</span>
          <h2>{isOverdueOnly ? 'Vadesi geçen görevler' : 'Görevler'}</h2>
          <p>Görevlerini oluştur, filtrele ve ilerleme durumlarını takip et.</p>
        </div>
        <Button label="Yeni görev" icon="pi pi-plus" onClick={openCreateDialog} />
      </section>

      <section className="task-toolbar" aria-label="Görev filtreleri">
        <div className="task-view-switch">
          <Button
            label="Tüm görevler"
            icon="pi pi-list"
            severity="secondary"
            outlined={isOverdueOnly}
            onClick={() => {
              if (isOverdueOnly) toggleOverdue()
            }}
          />
          <Button
            label="Vadesi geçenler"
            icon="pi pi-clock"
            severity="danger"
            outlined={!isOverdueOnly}
            onClick={() => {
              if (!isOverdueOnly) toggleOverdue()
            }}
          />
        </div>

        {!isOverdueOnly && (
          <div className="task-filters">
            <span className="p-input-icon-left task-search-field">
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                value={searchText}
                placeholder="Görevlerde ara"
                aria-label="Görevlerde ara"
                onChange={(event) => setSearchText(event.target.value)}
              />
            </span>
            <Dropdown
              value={categoryId}
              options={categoryOptions}
              placeholder="Kategori"
              aria-label="Kategori filtresi"
              showClear
              onChange={(event) => {
                setCategoryId(event.value ?? null)
                setPageNumber(1)
              }}
            />
            <Dropdown
              value={status}
              options={statusOptions}
              placeholder="Durum"
              aria-label="Durum filtresi"
              showClear
              onChange={(event) => {
                setStatus((event.value as TaskStatus | null) ?? null)
                setPageNumber(1)
              }}
            />
            <Dropdown
              value={priority}
              options={priorityOptions}
              placeholder="Öncelik"
              aria-label="Öncelik filtresi"
              showClear
              onChange={(event) => {
                setPriority((event.value as Priority | null) ?? null)
                setPageNumber(1)
              }}
            />
            <label className="date-filter-field">
              <span>Başlangıç</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setPageNumber(1)
                }}
              />
            </label>
            <label className="date-filter-field">
              <span>Bitiş</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setPageNumber(1)
                }}
              />
            </label>
            {hasFilters && (
              <Button label="Temizle" icon="pi pi-filter-slash" text severity="secondary" onClick={resetFilters} />
            )}
          </div>
        )}
      </section>

      {loadError && (
        <div className="task-load-error" role="alert">
          <div>
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <Button label="Tekrar dene" icon="pi pi-refresh" outlined onClick={() => setRefreshKey((current) => current + 1)} />
        </div>
      )}

      <section className="task-table-card" aria-label="Görev listesi">
        <DataTable
          value={result.items}
          dataKey="id"
          lazy
          paginator
          loading={isLoading}
          first={(pageNumber - 1) * pageSize}
          rows={pageSize}
          totalRecords={result.totalCount}
          rowsPerPageOptions={[5, 10, 20, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="{first}-{last} / {totalRecords} görev"
          emptyMessage={isOverdueOnly ? 'Vadesi geçen görev bulunmuyor.' : 'Filtrelerle eşleşen görev bulunamadı.'}
          rowClassName={(task) => isTaskOverdue(task) ? 'overdue-task-row' : ''}
          stripedRows
          scrollable
          tableStyle={{ minWidth: '70rem' }}
          onPage={handlePage}
        >
          <Column header="Görev" body={titleTemplate} style={{ minWidth: '18rem' }} />
          <Column header="Durum" body={(task: Task) => <StatusTag status={task.status} />} />
          <Column header="Öncelik" body={(task: Task) => <PriorityTag priority={task.priority} />} />
          <Column header="Kategori" body={categoryTemplate} style={{ minWidth: '9rem' }} />
          <Column header="Son tarih" body={dueDateTemplate} style={{ minWidth: '8rem' }} />
          <Column header="Oluşturuldu" body={(task: Task) => formatTaskDate(task.createdAt)} style={{ minWidth: '8rem' }} />
          <Column header="İşlemler" body={actionsTemplate} frozen alignFrozen="right" style={{ width: '9rem' }} />
        </DataTable>
      </section>

      {isFormOpen && (
        <TaskFormDialog
          key={editingTask?.id ?? 'new-task'}
          categories={categories}
          task={editingTask}
          onHide={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
