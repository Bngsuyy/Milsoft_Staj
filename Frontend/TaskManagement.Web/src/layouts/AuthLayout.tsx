import { Outlet } from 'react-router-dom'
import { ThemeToggleButton } from '../components'

export function AuthLayout() {
  return (
    <main className="auth-page">
      <ThemeToggleButton className="auth-theme-toggle" />
      <div className="auth-shell">
        <section className="auth-brand" aria-label="Uygulama tanıtımı">
          <div className="auth-brand-content">
            <span className="auth-logo inline-flex align-items-center justify-content-center">
              <i className="pi pi-check-square" aria-hidden="true" />
            </span>
            <p className="auth-eyebrow">Task Management System</p>
            <h1>Planla, takip et ve tamamla.</h1>
            <p>
              Günlük görevlerini, kategorilerini ve teslim tarihlerini tek bir yerde yönet.
            </p>
          </div>

          <div className="auth-feature-list" aria-label="Özellikler">
            <span><i className="pi pi-shield" aria-hidden="true" /> Güvenli JWT oturumu</span>
            <span><i className="pi pi-bolt" aria-hidden="true" /> Hızlı görev yönetimi</span>
            <span><i className="pi pi-chart-bar" aria-hidden="true" /> Performans özeti</span>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-form-wrapper">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}
