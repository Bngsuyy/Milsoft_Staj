import { type FormEvent, useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Skeleton } from 'primereact/skeleton'
import { commentService } from '../services'
import type { TaskComment } from '../types'
import { formatTaskDateTime, getApiErrorMessage } from '../utils'

const MAX_COMMENT_LENGTH = 2000

interface TaskCommentsSectionProps {
  taskId: string
  currentUserId?: string
  onNotify: (severity: 'success' | 'error', summary: string, detail: string) => void
}

function getInitials(username: string): string {
  return username.trim().slice(0, 2).toLocaleUpperCase('tr-TR') || 'K'
}

export function TaskCommentsSection({
  taskId,
  currentUserId,
  onNotify,
}: TaskCommentsSectionProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isActive = true

    async function loadComments() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await commentService.getAll(taskId)
        if (isActive) setComments(response)
      } catch (error) {
        if (isActive) {
          setLoadError(getApiErrorMessage(error, 'Yorumlar yüklenemedi.'))
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadComments()
    return () => {
      isActive = false
    }
  }, [taskId, refreshKey])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedComment = commentText.trim()

    if (!normalizedComment) {
      onNotify('error', 'Yorum eklenemedi', 'Yorum metni boş bırakılamaz.')
      return
    }

    setIsSubmitting(true)
    try {
      const createdComment = await commentService.create(taskId, {
        comment: normalizedComment,
      })
      setComments((current) => [...current, createdComment])
      setCommentText('')
      setLoadError(null)
      onNotify('success', 'Yorum eklendi', 'Yorumunuz göreve eklendi.')
    } catch (error) {
      onNotify(
        'error',
        'Yorum eklenemedi',
        getApiErrorMessage(error, 'Yorum eklenirken bir hata oluştu.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteComment(comment: TaskComment) {
    setDeletingId(comment.id)
    try {
      await commentService.delete(taskId, comment.id)
      setComments((current) => current.filter((item) => item.id !== comment.id))
      onNotify('success', 'Yorum silindi', 'Yorum görevden kaldırıldı.')
    } catch (error) {
      onNotify(
        'error',
        'Yorum silinemedi',
        getApiErrorMessage(error, 'Yorum silinirken bir hata oluştu.'),
      )
    } finally {
      setDeletingId(null)
    }
  }

  function requestDelete(comment: TaskComment) {
    confirmDialog({
      header: 'Yorumu sil',
      message: 'Bu yorum kalıcı olarak silinsin mi?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, sil',
      rejectLabel: 'Vazgeç',
      acceptClassName: 'p-button-danger',
      accept: () => void deleteComment(comment),
    })
  }

  return (
    <section className="task-workspace-card task-comments-section" aria-labelledby="task-comments-title">
      <header className="task-workspace-heading">
        <div>
          <span className="task-workspace-icon" aria-hidden="true">
            <i className="pi pi-comments" />
          </span>
          <div>
            <h3 id="task-comments-title">Yorumlar</h3>
            <p>Görevle ilgili notları burada takip edin.</p>
          </div>
        </div>
        <span className="task-workspace-count" aria-label={`${comments.length} yorum`}>
          {comments.length}
        </span>
      </header>

      <form className="comment-form" onSubmit={submitComment}>
        <label htmlFor="task-comment">Yeni yorum</label>
        <InputTextarea
          id="task-comment"
          value={commentText}
          rows={3}
          maxLength={MAX_COMMENT_LENGTH}
          autoResize
          placeholder="Görevle ilgili bir not yazın..."
          disabled={isSubmitting}
          onChange={(event) => setCommentText(event.target.value)}
        />
        <div className="comment-form-footer">
          <small>{commentText.length}/{MAX_COMMENT_LENGTH}</small>
          <Button
            type="submit"
            label="Yorum ekle"
            icon="pi pi-send"
            loading={isSubmitting}
            disabled={!commentText.trim() || isSubmitting}
          />
        </div>
      </form>

      <div className="comment-list" aria-live="polite" aria-busy={isLoading}>
        {isLoading && Array.from({ length: 2 }, (_, index) => (
          <div className="comment-item comment-skeleton" key={index}>
            <Skeleton shape="circle" size="2.5rem" />
            <div>
              <Skeleton width="9rem" height="0.85rem" />
              <Skeleton width="100%" height="0.75rem" />
              <Skeleton width="70%" height="0.75rem" />
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

        {!isLoading && !loadError && comments.length === 0 && (
          <div className="workspace-empty-state">
            <i className="pi pi-comment" aria-hidden="true" />
            <strong>Henüz yorum yok</strong>
            <span>İlk notu yukarıdaki alandan ekleyebilirsiniz.</span>
          </div>
        )}

        {!isLoading && !loadError && comments.map((comment) => (
          <article className="comment-item" key={comment.id}>
            <span className="comment-avatar" aria-hidden="true">
              {getInitials(comment.username)}
            </span>
            <div className="comment-content">
              <div className="comment-meta">
                <div>
                  <strong>{comment.username}</strong>
                  <time dateTime={comment.createdAt}>{formatTaskDateTime(comment.createdAt)}</time>
                </div>
                {comment.userId === currentUserId && (
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    loading={deletingId === comment.id}
                    disabled={Boolean(deletingId)}
                    aria-label={`${comment.username} kullanıcısının yorumunu sil`}
                    onClick={() => requestDelete(comment)}
                  />
                )}
              </div>
              <p>{comment.comment}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
