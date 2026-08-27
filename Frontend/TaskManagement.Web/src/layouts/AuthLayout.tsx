import { Outlet, useLocation } from 'react-router-dom'
import { ThemeToggleButton } from '../components'

export function AuthLayout() {
  const { pathname } = useLocation()
  const isLoginPage = pathname === '/login'

  return (
    <main className={`auth-page${isLoginPage ? ' auth-page--login' : ''}`}>
      <ThemeToggleButton className="auth-theme-toggle" />
      <div className="auth-shell">
        <section className="auth-brand" aria-label="Uygulama tanıtımı">
          <div className="auth-brand-content">
            <span className="auth-logo inline-flex align-items-center justify-content-center">
              <img src="/favicon.svg?v=3" alt="MilSOFT" aria-hidden="true" />
            </span>
            <h1 className="auth-product-title">Task Management System</h1>
            <p className="auth-message">
              <strong className="auth-vision">Planla, takip et ve tamamla.</strong>
              <span>Günlük görevlerini, kategorilerini ve teslim tarihlerini tek bir yerde yönet.</span>
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
