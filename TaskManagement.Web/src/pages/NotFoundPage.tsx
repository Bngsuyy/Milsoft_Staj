import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="content-page not-found-page">
      <section className="empty-state-card not-found-card">
        <span className="error-code">404</span>
        <h2>Sayfa bulunamadı</h2>
        <p>Aradığın adres taşınmış, silinmiş veya hiç oluşturulmamış olabilir.</p>
        <Link className="primary-action-button" to="/dashboard">
          <i className="pi pi-home" aria-hidden="true" />
          Dashboard’a dön
        </Link>
      </section>
    </div>
  )
}
