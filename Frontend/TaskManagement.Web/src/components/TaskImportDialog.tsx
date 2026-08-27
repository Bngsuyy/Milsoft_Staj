import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { taskService } from '../services'
import type { Category, Task } from '../types'
import {
  convertToCreateTaskRequests,
  downloadExcelTemplate,
  downloadJsonTemplate,
  formatTaskDate,
  getApiErrorMessage,
  getPrioritySeverity,
  getStatusSeverity,
  parseImportFile,
} from '../utils'
import type { ParsedImportTask, TaskImportResult } from '../utils'

interface TaskImportDialogProps {
  visible: boolean
  categories: Category[]
  onHide: () => void
  onSuccess: (importedCount: number, tasks: Task[]) => void
}

export function TaskImportDialog({ visible, categories, onHide, onSuccess }: TaskImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseResult, setParseResult] = useState<TaskImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  function resetState() {
    setSelectedFile(null)
    setParseResult(null)
    setErrorMessage(null)
    setIsParsing(false)
    setIsImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    if (isImporting) return
    resetState()
    onHide()
  }

  async function processFile(file: File) {
    setSelectedFile(file)
    setErrorMessage(null)
    setIsParsing(true)

    try {
      const result = await parseImportFile(file, categories)
      setParseResult(result)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Dosya ayrıştırılamadı. Lütfen şablona uygun bir dosya seçiniz.'))
      setParseResult(null)
    } finally {
      setIsParsing(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (files && files.length > 0) {
      void processFile(files[0])
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      void processFile(files[0])
    }
  }

  async function handleImport() {
    if (!parseResult || parseResult.validCount === 0) return

    setIsImporting(true)
    setErrorMessage(null)

    try {
      const requests = convertToCreateTaskRequests(parseResult.tasks)
      const createdTasks = await taskService.bulkCreate(requests)
      onSuccess(createdTasks.length, createdTasks)
      handleClose()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Görevler içe aktarılırken bir hata oluştu.'))
    } finally {
      setIsImporting(false)
    }
  }

  const validStatusBody = (task: ParsedImportTask) => (
    task.isValid ? (
      <Tag severity="success" value="Geçerli" icon="pi pi-check" />
    ) : (
      <Tag severity="danger" value="Hatalı" icon="pi pi-times" />
    )
  )

  const priorityBody = (task: ParsedImportTask) => (
    <Tag severity={getPrioritySeverity(task.priority)} value={task.priorityLabel} />
  )

  const statusBody = (task: ParsedImportTask) => (
    <Tag severity={getStatusSeverity(task.status)} value={task.statusLabel} />
  )

  const categoryBody = (task: ParsedImportTask) => (
    <span className="inline-flex align-items-center gap-1">
      <i className="pi pi-folder text-xs opacity-70" />
      <span>{task.categoryName ?? 'Kategorisiz'}</span>
    </span>
  )

  const dueDateBody = (task: ParsedImportTask) => (
    <span>{task.dueDate ? formatTaskDate(task.dueDate) : '-'}</span>
  )

  const errorsBody = (task: ParsedImportTask) => (
    task.errors.length > 0 ? (
      <span className="text-red-500 text-xs font-semibold">{task.errors.join(', ')}</span>
    ) : (
      <span className="text-500 text-xs">-</span>
    )
  )

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header="Görevleri İçe Aktar (Excel / JSON)"
      className="task-import-dialog"
      style={{ width: '92vw', maxWidth: '58rem' }}
      modal
      dismissableMask={!isImporting}
    >
      <div className="task-import-container">
        {/* Template download section */}
        <section className="task-import-template-bar">
          <div>
            <strong>Örnek Şablonlar:</strong>
            <p>Verilerinizi şablona uygun doldurarak tek seferde yüzlerce görevi aktarabilirsiniz.</p>
          </div>
          <div className="task-import-template-buttons">
            <Button
              label="Excel Şablonu (.xlsx)"
              icon="pi pi-file-excel"
              severity="secondary"
              outlined
              size="small"
              onClick={() => downloadExcelTemplate(categories)}
            />
            <Button
              label="JSON Şablonu (.json)"
              icon="pi pi-code"
              severity="secondary"
              outlined
              size="small"
              onClick={() => downloadJsonTemplate(categories)}
            />
          </div>
        </section>

        {/* File upload / Dropzone section */}
        {!parseResult && !isParsing && (
          <div
            className={`task-import-dropzone${isDragging ? ' is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className="task-import-dropzone-icon">
              <i className="pi pi-cloud-upload" />
            </div>
            <strong>Dosyayı buraya sürükleyin veya seçmek için tıklayın</strong>
            <span>Desteklenen dosya türleri: <code>.xlsx</code>, <code>.xls</code>, <code>.json</code></span>
          </div>
        )}

        {/* Parsing state */}
        {isParsing && (
          <div className="task-import-loading">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
            <span>Dosya okunuyor ve doğrulanıyor...</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="task-load-error my-3" role="alert">
            <i className="pi pi-exclamation-circle" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Parse preview table */}
        {parseResult && (
          <div className="task-import-preview">
            <div className="task-import-preview-header">
              <div className="task-import-file-badge">
                <i className="pi pi-file" />
                <span>{selectedFile?.name}</span>
              </div>
              <div className="task-import-stat-badges">
                <Tag severity="info" value={`Toplam: ${parseResult.totalRows}`} />
                <Tag severity="success" value={`Geçerli: ${parseResult.validCount}`} />
                {parseResult.invalidCount > 0 && (
                  <Tag severity="danger" value={`Hatalı: ${parseResult.invalidCount}`} />
                )}
                <Button
                  label="Farklı Dosya Seç"
                  icon="pi pi-refresh"
                  text
                  size="small"
                  onClick={resetState}
                  disabled={isImporting}
                />
              </div>
            </div>

            <div className="task-import-table-wrapper">
              <DataTable
                value={parseResult.tasks}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 20]}
                responsiveLayout="scroll"
                emptyMessage="Önizlenecek görev bulunamadı."
                size="small"
                stripedRows
              >
                <Column header="Durum" body={validStatusBody} style={{ width: '6.5rem' }} />
                <Column field="title" header="Başlık" style={{ minWidth: '13rem' }} />
                <Column field="priorityLabel" header="Öncelik" body={priorityBody} style={{ width: '7rem' }} />
                <Column field="statusLabel" header="Durum" body={statusBody} style={{ width: '8rem' }} />
                <Column field="categoryName" header="Kategori" body={categoryBody} style={{ width: '8.5rem' }} />
                <Column field="dueDate" header="Son Tarih" body={dueDateBody} style={{ width: '7.5rem' }} />
                <Column header="Doğrulama Notu" body={errorsBody} style={{ minWidth: '10rem' }} />
              </DataTable>
            </div>
          </div>
        )}
      </div>

      <div className="task-import-dialog-footer">
        <Button
          label="Vazgeç"
          icon="pi pi-times"
          severity="secondary"
          text
          onClick={handleClose}
          disabled={isImporting}
        />
        <Button
          label={isImporting ? 'İçe Aktarılıyor...' : `${parseResult?.validCount ?? 0} Görevi İçe Aktar`}
          icon={isImporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
          onClick={handleImport}
          disabled={!parseResult || parseResult.validCount === 0 || isImporting}
        />
      </div>
    </Dialog>
  )
}
