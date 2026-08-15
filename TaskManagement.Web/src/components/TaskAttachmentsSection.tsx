import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { ProgressBar } from 'primereact/progressbar'
import { Skeleton } from 'primereact/skeleton'
import { attachmentService } from '../services'
import type { TaskAttachment } from '../types'
import { formatTaskDateTime, getApiErrorMessage } from '../utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024

interface TaskAttachmentsSectionProps {
  taskId: string
  onNotify: (severity: 'success' | 'error', summary: string, detail: string) => void
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} KB`
  return `${(size / (1024 * 1024)).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return 'pi pi-image'
  if (contentType.includes('pdf')) return 'pi pi-file-pdf'
  if (contentType.includes('zip') || contentType.includes('compressed')) return 'pi pi-box'
  if (contentType.includes('sheet') || contentType.includes('excel')) return 'pi pi-table'
  return 'pi pi-file'
}

export function TaskAttachmentsSection({ taskId, onNotify }: TaskAttachmentsSectionProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadFileName, setUploadFileName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadAttachments() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await attachmentService.getAll(taskId)
        if (isActive) setAttachments(response)
      } catch (error) {
        if (isActive) {
          setLoadError(getApiErrorMessage(error, 'Dosyalar yüklenemedi.'))
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadAttachments()
    return () => {
      isActive = false
    }
  }, [taskId, refreshKey])

  async function uploadFile(file: File) {
    if (isUploading) return

    if (file.size === 0) {
      onNotify('error', 'Dosya yüklenemedi', 'Boş bir dosya yükleyemezsiniz.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      onNotify('error', 'Dosya çok büyük', 'Dosya boyutu 10 MB sınırını aşamaz.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadFileName(file.name)

    try {
      const uploadedAttachment = await attachmentService.upload(taskId, file, {
        onProgress: setUploadProgress,
      })
      setAttachments((current) => [uploadedAttachment, ...current])
      setLoadError(null)
      setUploadProgress(100)
      onNotify('success', 'Dosya yüklendi', `${file.name} göreve eklendi.`)
    } catch (error) {
      onNotify(
        'error',
        'Dosya yüklenemedi',
        getApiErrorMessage(error, 'Dosya yüklenirken bir hata oluştu.'),
      )
    } finally {
      setIsUploading(false)
      setUploadFileName('')
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void uploadFile(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void uploadFile(file)
  }

  async function downloadAttachment(attachment: TaskAttachment) {
    setDownloadingId(attachment.id)
    try {
      const fileBlob = await attachmentService.download(taskId, attachment.id)
      const objectUrl = URL.createObjectURL(fileBlob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = attachment.fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    } catch (error) {
      onNotify(
        'error',
        'Dosya indirilemedi',
        getApiErrorMessage(error, 'Dosya indirilirken bir hata oluştu.'),
      )
    } finally {
      setDownloadingId(null)
    }
  }

  async function deleteAttachment(attachment: TaskAttachment) {
    setDeletingId(attachment.id)
    try {
      await attachmentService.delete(taskId, attachment.id)
      setAttachments((current) => current.filter((item) => item.id !== attachment.id))
      onNotify('success', 'Dosya silindi', `${attachment.fileName} görevden kaldırıldı.`)
    } catch (error) {
      onNotify(
        'error',
        'Dosya silinemedi',
        getApiErrorMessage(error, 'Dosya silinirken bir hata oluştu.'),
      )
    } finally {
      setDeletingId(null)
    }
  }

  function requestDelete(attachment: TaskAttachment) {
    confirmDialog({
      header: 'Dosyayı sil',
      message: `“${attachment.fileName}” kalıcı olarak silinsin mi?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, sil',
      rejectLabel: 'Vazgeç',
      acceptClassName: 'p-button-danger',
      accept: () => void deleteAttachment(attachment),
    })
  }

  return (
    <section className="task-workspace-card task-attachments-section" aria-labelledby="task-attachments-title">
      <header className="task-workspace-heading">
        <div>
          <span className="task-workspace-icon attachment-heading-icon" aria-hidden="true">
            <i className="pi pi-paperclip" />
          </span>
          <div>
            <h3 id="task-attachments-title">Dosyalar</h3>
            <p>Görevle ilgili belgeleri tek yerde saklayın.</p>
          </div>
        </div>
        <span className="task-workspace-count" aria-label={`${attachments.length} dosya`}>
          {attachments.length}
        </span>
      </header>

      <input
        ref={fileInput}
        className="visually-hidden-file-input"
        type="file"
        tabIndex={-1}
        disabled={isUploading}
        onChange={handleFileChange}
      />

      <div
        className={`attachment-dropzone${isDragging ? ' is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!isUploading) setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
            setIsDragging(false)
          }
        }}
        onDrop={handleDrop}
      >
        <i className="pi pi-cloud-upload" aria-hidden="true" />
        <div>
          <strong>Dosyanızı buraya bırakın</strong>
          <span>veya bilgisayarınızdan seçin · en fazla 10 MB</span>
        </div>
        <Button
          type="button"
          label="Dosya seç"
          icon="pi pi-plus"
          outlined
          disabled={isUploading}
          onClick={() => fileInput.current?.click()}
        />
      </div>

      {isUploading && (
        <div className="attachment-upload-progress" aria-live="polite">
          <div>
            <span>{uploadFileName}</span>
            <strong>%{uploadProgress}</strong>
          </div>
          <ProgressBar value={uploadProgress} showValue={false} />
        </div>
      )}

      <div className="attachment-list" aria-live="polite" aria-busy={isLoading}>
        {isLoading && Array.from({ length: 2 }, (_, index) => (
          <div className="attachment-item attachment-skeleton" key={index}>
            <Skeleton width="2.6rem" height="2.6rem" borderRadius="0.75rem" />
            <div>
              <Skeleton width="11rem" height="0.85rem" />
              <Skeleton width="7rem" height="0.7rem" />
            </div>
          </div>
        ))}

        {!isLoading && loadError && (
          <div className="workspace-inline-error" role="alert">
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{loadError}</span>
            <Button
              type="button"
              label="Tekrar dene"
              icon="pi pi-refresh"
              text
              onClick={() => setRefreshKey((current) => current + 1)}
            />
          </div>
        )}

        {!isLoading && !loadError && attachments.length === 0 && (
          <div className="workspace-empty-state compact">
            <i className="pi pi-folder-open" aria-hidden="true" />
            <strong>Henüz dosya yok</strong>
            <span>İlk dosyayı yukarıdaki alandan yükleyebilirsiniz.</span>
          </div>
        )}

        {!isLoading && !loadError && attachments.map((attachment) => (
          <article className="attachment-item" key={attachment.id}>
            <span className="attachment-file-icon" aria-hidden="true">
              <i className={getFileIcon(attachment.contentType)} />
            </span>
            <div className="attachment-information">
              <button type="button" onClick={() => void downloadAttachment(attachment)}>
                {attachment.fileName}
              </button>
              <span>
                {formatFileSize(attachment.fileSize)} · {formatTaskDateTime(attachment.uploadedAt)}
              </span>
            </div>
            <div className="attachment-actions">
              <Button
                type="button"
                icon="pi pi-download"
                text
                rounded
                loading={downloadingId === attachment.id}
                disabled={Boolean(downloadingId) || Boolean(deletingId)}
                aria-label={`${attachment.fileName} dosyasını indir`}
                onClick={() => void downloadAttachment(attachment)}
              />
              <Button
                type="button"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                loading={deletingId === attachment.id}
                disabled={Boolean(downloadingId) || Boolean(deletingId)}
                aria-label={`${attachment.fileName} dosyasını sil`}
                onClick={() => requestDelete(attachment)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
