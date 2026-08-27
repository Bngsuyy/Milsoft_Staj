import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import type { ColumnEditorOptions } from 'primereact/column'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { DataTable } from 'primereact/datatable'
import type { DataTablePageEvent } from 'primereact/datatable'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Paginator } from 'primereact/paginator'
import { SplitButton } from 'primereact/splitbutton'
import { Toast } from 'primereact/toast'
import {
  KeyboardShortcutsDialog,
  PriorityTag,
  StatusTag,
  TaskBoard,
  TaskFormDialog,
  TaskImportDialog,
} from '../components'
import { useKeyboardShortcuts } from '../hooks'
import type { KeyboardShortcut } from '../hooks'
import { categoryService, taskService } from '../services'
import { TaskStatus } from '../types'
import type { Category, PagedResult, Priority, Task, TaskFilter } from '../types'
import {
  formatTaskDate,
  getApiErrorMessage,
  isTaskOverdue,
  priorityOptions,
  statusOptions,
} from '../utils'
import { exportTasksToExcel, exportTasksToPdf, printTasks } from '../utils/taskExport'

type TaskView = 'list' | 'board'

const emptyResult: PagedResult<Task> = {
  items: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
}

/** Pano görünümü sayfalama yerine tek seferde daha çok kayıt gösterir. */
const BOARD_PAGE_SIZE = 50

function toStartOfDay(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined
}

function toEndOfDay(value: string): string | undefined {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined
}

function getStatusFromQuery(value: string | null): TaskStatus | null {
  return value && Object.values(TaskStatus).includes(value as TaskStatus)
    ? value as TaskStatus
    : null
}

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useRef<Toast>(null)
  const searchInput = useRef<HTMLInputElement>(null)

  // `status` ve `view` doğrudan URL'den türetilir; böylece adres çubuğu ile
  // ekrandaki filtreler hiçbir zaman birbirinden ayrışmaz.
  const isOverdueOnly = searchParams.get('view') === 'overdue'
  const status = getStatusFromQuery(searchParams.get('status'))

  const [result, setResult] = useState<PagedResult<Task>>(emptyResult)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<TaskView>('list')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [priority, setPriority] = useState<Priority | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])
  const [bulkStatus, setBulkStatus] = useState<TaskStatus | null>(null)
  const [isBulkRunning, setIsBulkRunning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const effectivePageSize = view === 'board' ? BOARD_PAGE_SIZE : pageSize

  const filter: TaskFilter = useMemo(() => ({
    searchTerm: debouncedSearch || undefined,
    status: status ?? undefined,
    priority: priority ?? undefined,
    categoryId: categoryId ?? undefined,
    startDate: toStartOfDay(startDate),
    endDate: toEndOfDay(endDate),
  }), [categoryId, debouncedSearch, endDate, priority, startDate, status])

  // Filtre değiştiğinde ilk sayfaya dön. Bunu render sırasında düzeltmek, eski
  // sayfa numarasıyla gereksiz bir istek atılmasını önler.
  const filterSignature = JSON.stringify([filter, isOverdueOnly, effectivePageSize])
  const [previousSignature, setPreviousSignature] = useState(filterSignature)
  if (previousSignature !== filterSignature) {
    setPreviousSignature(filterSignature)
    if (pageNumber !== 1) setPageNumber(1)
    if (selectedTasks.length > 0) setSelectedTasks([])
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 400)
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
          ? await taskService.getOverdue({ pageNumber, pageSize: effectivePageSize })
          : await taskService.getAll({ ...filter, pageNumber, pageSize: effectivePageSize })

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
  }, [effectivePageSize, filter, isOverdueOnly, pageNumber, refreshKey])

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }))
  const hasFilters = Boolean(
    searchText || status || priority || categoryId || startDate || endDate,
  )

  const notify = useCallback(
    (severity: 'success' | 'error' | 'warn', summary: string, detail: string) => {
      toast.current?.show({ severity, summary, detail })
    },
    [],
  )

  function updateStatusParam(nextStatus: TaskStatus | null) {
    const params = new URLSearchParams(searchParams)
    params.delete('view')

    if (nextStatus) params.set('status', nextStatus)
    else params.delete('status')

    setSearchParams(params, { replace: true })
  }

  const clearLocalFilters = useCallback(() => {
    setSearchText('')
    setDebouncedSearch('')
    setPriority(null)
    setCategoryId(null)
    setStartDate('')
    setEndDate('')
  }, [])

  const resetFilters = useCallback(() => {
    clearLocalFilters()
    setSearchParams({}, { replace: true })
  }, [clearLocalFilters, setSearchParams])

  function switchToOverdue(nextValue: boolean) {
    if (nextValue === isOverdueOnly) return

    clearLocalFilters()
    setSearchParams(nextValue ? { view: 'overdue' } : {}, { replace: true })
  }

  const openCreateDialog = useCallback(() => {
    setEditingTask(null)
    setIsFormOpen(true)
  }, [])

  function openEditDialog(task: Task) {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  function handleSaved(savedTask: Task) {
    setIsFormOpen(false)
    setEditingTask(null)
    setRefreshKey((current) => current + 1)
    notify('success', editingTask ? 'Görev güncellendi' : 'Görev oluşturuldu', savedTask.title)
  }

  function handleImportSuccess(count: number) {
    setIsImportOpen(false)
    setRefreshKey((current) => current + 1)
    notify('success', 'İçe aktarma tamamlandı', `${count} görev başarıyla sisteme aktarıldı.`)
  }

  /** Satır içi düzenleme ve sürükle-bırak için ortak güncelleme yolu. */
  async function applyTaskChange(task: Task, changes: Partial<Task>) {
    const updatedTask = { ...task, ...changes }

    // İyimser güncelleme: kullanıcı sonucu beklemeden görür.
    setResult((current) => ({
      ...current,
      items: current.items.map((item) => item.id === task.id ? updatedTask : item),
    }))

    try {
      const savedTask = await taskService.update(task.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status,
        dueDate: updatedTask.dueDate,
        categoryId: updatedTask.category?.id ?? null,
      })

      setResult((current) => ({
        ...current,
        items: current.items.map((item) => item.id === task.id ? savedTask : item),
      }))
    } catch (error) {
      // Sunucu reddederse iyimser güncelleme geri alınır.
      setResult((current) => ({
        ...current,
        items: current.items.map((item) => item.id === task.id ? task : item),
      }))
      notify('error', 'Görev güncellenemedi', getApiErrorMessage(error, 'Değişiklik kaydedilemedi.'))
    }
  }

  async function deleteTask(task: Task) {
    try {
      await taskService.delete(task.id)
      notify('success', 'Görev silindi', task.title)

      if (result.items.length === 1 && pageNumber > 1) setPageNumber((current) => current - 1)
      else setRefreshKey((current) => current + 1)
    } catch (error) {
      notify('error', 'Görev silinemedi', getApiErrorMessage(error, 'Görev silinirken bir hata oluştu.'))
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

  async function runBulkStatusUpdate() {
    if (!bulkStatus || selectedTasks.length === 0) return

    setIsBulkRunning(true)
    try {
      const response = await taskService.bulkUpdateStatus({
        taskIds: selectedTasks.map((task) => task.id),
        status: bulkStatus,
      })
      notify('success', 'Toplu güncelleme tamamlandı', `${response.affectedCount} görev güncellendi.`)
      setSelectedTasks([])
      setBulkStatus(null)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      notify('error', 'Toplu güncelleme başarısız', getApiErrorMessage(error, 'Görevler güncellenemedi.'))
    } finally {
      setIsBulkRunning(false)
    }
  }

  async function runBulkDelete() {
    if (selectedTasks.length === 0) return

    setIsBulkRunning(true)
    try {
      const response = await taskService.bulkDelete({
        taskIds: selectedTasks.map((task) => task.id),
      })
      notify('success', 'Toplu silme tamamlandı', `${response.affectedCount} görev silindi.`)
      setSelectedTasks([])
      setPageNumber(1)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      notify('error', 'Toplu silme başarısız', getApiErrorMessage(error, 'Görevler silinemedi.'))
    } finally {
      setIsBulkRunning(false)
    }
  }

  function requestBulkDelete() {
    confirmDialog({
      header: 'Seçili görevleri sil',
      message: `${selectedTasks.length} görev kalıcı olarak silinsin mi?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, sil',
      rejectLabel: 'Vazgeç',
      acceptClassName: 'p-button-danger',
      accept: () => void runBulkDelete(),
    })
  }

  /** Dışa aktarma ve yazdırma seçili kayıtları, seçim yoksa tüm filtre sonucunu kullanır. */
  const runExport = useCallback(
    async (mode: 'excel' | 'pdf' | 'print') => {
      setIsExporting(true)
      try {
        const collected = selectedTasks.length > 0
          ? { items: selectedTasks, isTruncated: false, totalCount: selectedTasks.length, limit: selectedTasks.length }
          : await taskService.getAllMatching(filter, isOverdueOnly)

        const tasks = collected.items

        if (tasks.length === 0) {
          notify('warn', 'Dışa aktarılacak görev yok', 'Filtrelerle eşleşen görev bulunamadı.')
          return
        }

        if (mode === 'excel') await exportTasksToExcel(tasks)
        else if (mode === 'pdf') await exportTasksToPdf(tasks)
        else printTasks(tasks, isOverdueOnly ? 'Vadesi geçen görevler' : 'Görevler')

        // Üst sınır aşıldıysa eksik çıktı sessizce bırakılmaz.
        if (collected.isTruncated) {
          notify(
            'warn',
            'Çıktı ilk ' + collected.limit + ' görevle sınırlandı',
            `Filtreye ${collected.totalCount} görev uyuyor. Tamamını almak için filtreleri daraltın veya listeden seçim yapın.`,
          )
        } else if (mode !== 'print') {
          notify('success', 'Dışa aktarma tamamlandı', `${tasks.length} görev aktarıldı.`)
        }
      } catch (error) {
        notify('error', 'Dışa aktarma başarısız', getApiErrorMessage(error, 'Dosya oluşturulamadı.'))
      } finally {
        setIsExporting(false)
      }
    },
    [filter, isOverdueOnly, notify, selectedTasks],
  )

  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: 'n', description: 'Yeni görev oluştur', handler: openCreateDialog },
    {
      key: '/',
      description: 'Arama kutusuna odaklan',
      handler: () => searchInput.current?.focus(),
    },
    {
      key: 'b',
      description: 'Liste ve pano görünümü arasında geçiş yap',
      handler: () => setView((current) => current === 'list' ? 'board' : 'list'),
    },
    {
      key: 'r',
      description: 'Listeyi yenile',
      handler: () => setRefreshKey((current) => current + 1),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Görev listesini yazdır',
      handler: () => void runExport('print'),
    },
    {
      key: '?',
      shift: true,
      description: 'Klavye kısayolu yardımını aç',
      handler: () => setIsShortcutsOpen(true),
    },
    { key: 'Escape', description: 'Filtreleri temizle', handler: resetFilters },
  ], [openCreateDialog, resetFilters, runExport])

  // Modal açıkken kısayollar devre dışı kalır; PrimeReact kendi kapatma tuşlarını yönetir.
  useKeyboardShortcuts(shortcuts, !isFormOpen && !isShortcutsOpen)

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

  const titleEditor = (options: ColumnEditorOptions) => (
    <InputText
      className="inline-editor-input"
      value={options.value as string}
      maxLength={200}
      autoFocus
      aria-label="Görev başlığı"
      onChange={(event) => options.editorCallback?.(event.target.value)}
    />
  )

  const statusEditor = (options: ColumnEditorOptions) => (
    <Dropdown
      className="inline-editor-input"
      value={options.value as TaskStatus}
      options={statusOptions}
      aria-label="Görev durumu"
      onChange={(event) => options.editorCallback?.(event.value)}
    />
  )

  const priorityEditor = (options: ColumnEditorOptions) => (
    <Dropdown
      className="inline-editor-input"
      value={options.value as Priority}
      options={priorityOptions}
      aria-label="Görev önceliği"
      onChange={(event) => options.editorCallback?.(event.value)}
    />
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
        <div className="page-heading-actions">
          <Button
            label="İçe aktar"
            icon="pi pi-upload"
            severity="secondary"
            outlined
            onClick={() => setIsImportOpen(true)}
          />
          <SplitButton
            label="Dışa aktar"
            icon="pi pi-download"
            severity="secondary"
            outlined
            loading={isExporting}
            model={[
              { label: 'Excel (.xlsx)', icon: 'pi pi-file-excel', command: () => void runExport('excel') },
              { label: 'PDF (.pdf)', icon: 'pi pi-file-pdf', command: () => void runExport('pdf') },
              { label: 'Yazdır', icon: 'pi pi-print', command: () => void runExport('print') },
            ]}
            onClick={() => void runExport('excel')}
          />
          <Button label="Yeni görev" icon="pi pi-plus" onClick={openCreateDialog} />
        </div>
      </section>

      <section className="task-toolbar" aria-label="Görev filtreleri">
        <div className="task-view-switch">
          <Button
            label="Tüm görevler"
            icon="pi pi-list"
            severity="secondary"
            outlined={isOverdueOnly}
            onClick={() => switchToOverdue(false)}
          />
          <Button
            label="Vadesi geçenler"
            icon="pi pi-clock"
            severity="danger"
            outlined={!isOverdueOnly}
            onClick={() => switchToOverdue(true)}
          />
          <span className="task-view-divider" aria-hidden="true" />
          <Button
            label={view === 'list' ? 'Pano görünümü' : 'Liste görünümü'}
            icon={view === 'list' ? 'pi pi-th-large' : 'pi pi-table'}
            severity="secondary"
            text
            onClick={() => setView((current) => current === 'list' ? 'board' : 'list')}
          />
          <Button
            icon="pi pi-question-circle"
            rounded
            text
            severity="secondary"
            aria-label="Klavye kısayolları"
            tooltip="Klavye kısayolları"
            tooltipOptions={{ position: 'top' }}
            onClick={() => setIsShortcutsOpen(true)}
          />
        </div>

        {!isOverdueOnly && (
          <div className="task-filters">
            <span className="p-input-icon-left task-search-field">
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                ref={searchInput}
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
              onChange={(event) => setCategoryId(event.value ?? null)}
            />
            <Dropdown
              value={status}
              options={statusOptions}
              placeholder="Durum"
              aria-label="Durum filtresi"
              showClear
              onChange={(event) => updateStatusParam((event.value as TaskStatus | null) ?? null)}
            />
            <Dropdown
              value={priority}
              options={priorityOptions}
              placeholder="Öncelik"
              aria-label="Öncelik filtresi"
              showClear
              onChange={(event) => setPriority((event.value as Priority | null) ?? null)}
            />
            <label className="date-filter-field">
              <span>Başlangıç</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="date-filter-field">
              <span>Bitiş</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            {hasFilters && (
              <Button label="Temizle" icon="pi pi-filter-slash" text severity="secondary" onClick={resetFilters} />
            )}
          </div>
        )}
      </section>

      {selectedTasks.length > 0 && (
        <section className="bulk-actions-bar" aria-label="Toplu işlemler">
          <span className="bulk-actions-count">{selectedTasks.length} görev seçildi</span>
          <Dropdown
            value={bulkStatus}
            options={statusOptions}
            placeholder="Yeni durum seç"
            aria-label="Toplu durum değişikliği"
            onChange={(event) => setBulkStatus((event.value as TaskStatus | null) ?? null)}
          />
          <Button
            label="Durumu güncelle"
            icon="pi pi-check"
            disabled={!bulkStatus || isBulkRunning}
            loading={isBulkRunning}
            onClick={() => void runBulkStatusUpdate()}
          />
          <Button
            label="Seçilenleri sil"
            icon="pi pi-trash"
            severity="danger"
            outlined
            disabled={isBulkRunning}
            onClick={requestBulkDelete}
          />
          <Button
            label="Seçimi temizle"
            icon="pi pi-times"
            text
            severity="secondary"
            onClick={() => setSelectedTasks([])}
          />
        </section>
      )}

      {loadError && (
        <div className="task-load-error" role="alert">
          <div>
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <Button label="Tekrar dene" icon="pi pi-refresh" outlined onClick={() => setRefreshKey((current) => current + 1)} />
        </div>
      )}

      {view === 'board' ? (
        <>
          {result.totalCount > effectivePageSize && (
            <p className="board-scope-note" role="status">
              <i className="pi pi-info-circle" aria-hidden="true" />
              Pano, filtreye uyan {result.totalCount} görevin bu sayfadaki {result.items.length} tanesini
              gösterir. Sütun sayaçları da yalnızca bu sayfayı kapsar.
            </p>
          )}
          <TaskBoard
            tasks={result.items}
            isLoading={isLoading}
            onEdit={openEditDialog}
            onStatusChange={(task, nextStatus) => applyTaskChange(task, { status: nextStatus })}
          />
          {result.totalCount > effectivePageSize && (
            <Paginator
              first={(pageNumber - 1) * effectivePageSize}
              rows={effectivePageSize}
              totalRecords={result.totalCount}
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
              currentPageReportTemplate="{first}-{last} / {totalRecords} görev"
              onPageChange={(event) => setPageNumber(event.page + 1)}
            />
          )}
        </>
      ) : (
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
            editMode="cell"
            selection={selectedTasks}
            selectionMode="checkbox"
            onSelectionChange={(event) => setSelectedTasks(event.value as Task[])}
            tableStyle={{ minWidth: '64rem' }}
            onPage={handlePage}
          >
            <Column
              selectionMode="multiple"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              headerStyle={{ width: '3rem', textAlign: 'center' }}
              style={{ width: '3rem', textAlign: 'center' }}
            />
            <Column
              header="Görev"
              field="title"
              body={titleTemplate}
              editor={titleEditor}
              onCellEditComplete={(event) => {
                const nextTitle = String(event.newValue ?? '').trim()
                if (!nextTitle || nextTitle === event.rowData.title) return
                void applyTaskChange(event.rowData as Task, { title: nextTitle })
              }}
              style={{ minWidth: '14rem' }}
            />
            <Column
              header="Durum"
              field="status"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              body={(task: Task) => <StatusTag status={task.status} />}
              editor={statusEditor}
              onCellEditComplete={(event) => {
                if (event.newValue === event.rowData.status) return
                void applyTaskChange(event.rowData as Task, { status: event.newValue as TaskStatus })
              }}
              headerStyle={{ textAlign: 'center' }}
              style={{ width: '9.5rem', minWidth: '9.5rem', textAlign: 'center' }}
            />
            <Column
              header="Öncelik"
              field="priority"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              body={(task: Task) => <PriorityTag priority={task.priority} />}
              editor={priorityEditor}
              onCellEditComplete={(event) => {
                if (event.newValue === event.rowData.priority) return
                void applyTaskChange(event.rowData as Task, { priority: event.newValue as Priority })
              }}
              headerStyle={{ textAlign: 'center' }}
              style={{ width: '8.5rem', minWidth: '8.5rem', textAlign: 'center' }}
            />
            <Column
              header="Kategori"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              body={categoryTemplate}
              headerStyle={{ textAlign: 'center' }}
              style={{ width: '9.5rem', minWidth: '9.5rem', textAlign: 'center' }}
            />
            <Column
              header="Son Tarih"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              body={dueDateTemplate}
              headerStyle={{ textAlign: 'center' }}
              style={{ width: '9rem', minWidth: '9rem', textAlign: 'center' }}
            />
            <Column
              header="Oluşturulma"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              body={(task: Task) => formatTaskDate(task.createdAt)}
              headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap' }}
              style={{ width: '9.5rem', minWidth: '9.5rem', textAlign: 'center' }}
            />
            <Column
              header="İşlemler"
              align="center"
              alignHeader="center"
              headerClassName="text-center"
              bodyClassName="text-center"
              body={actionsTemplate}
              frozen
              alignFrozen="right"
              headerStyle={{ textAlign: 'center' }}
              style={{ width: '8rem', minWidth: '8rem', textAlign: 'center' }}
            />
          </DataTable>
        </section>
      )}

      {isFormOpen && (
        <TaskFormDialog
          key={editingTask?.id ?? 'new-task'}
          categories={categories}
          task={editingTask}
          onHide={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <TaskImportDialog
        visible={isImportOpen}
        categories={categories}
        onHide={() => setIsImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {isShortcutsOpen && (
        <KeyboardShortcutsDialog shortcuts={shortcuts} onHide={() => setIsShortcutsOpen(false)} />
      )}
    </div>
  )
}
