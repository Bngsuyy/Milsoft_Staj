import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="app-page flex align-items-center justify-content-center">
      <section className="foundation-card foundation-hero text-center">
        <span className="status-pill mx-auto">404</span>
        <h1 className="foundation-title mx-auto">Sayfa bulunamadı</h1>
        <p className="foundation-copy mx-auto">Aradığınız adres bu uygulamada tanımlı değil.</p>
        <Link className="not-found-link" to="/">
          <i className="pi pi-arrow-left" aria-hidden="true" />
          Ana sayfaya dön
        </Link>
      </section>
    </main>
  )
}
