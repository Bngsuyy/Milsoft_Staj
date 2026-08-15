import { Link, useParams } from 'react-router-dom'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="content-page">
      <Link className="back-link" to="/tasks">
        <i className="pi pi-arrow-left" aria-hidden="true" />
        Görevlere dön
      </Link>
      <section className="empty-state-card">
        <span className="empty-state-icon" aria-hidden="true"><i className="pi pi-file-edit" /></span>
        <h2>Görev detayı</h2>
        <p><code>{id}</code> kimlikli görev bu rota üzerinden açılacak.</p>
      </section>
    </div>
  )
}
