import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return null
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="app-mark inline-flex align-items-center justify-content-center">
            <i className="pi pi-check-square" aria-hidden="true" />
          </span>
          <div>
            <strong>Task Management</strong>
            <span>Frontend</span>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>
          <i className="pi pi-sign-out" aria-hidden="true" />
          Çıkış yap
        </button>
      </header>

      <section className="dashboard-content">
        <div>
          <span className="status-pill">Oturum aktif</span>
          <h1>Hoş geldin, {user.firstName}.</h1>
          <p>Authentication akışı tamamlandı. Sıradaki aşama uygulama layout’u ve görev ekranları.</p>
        </div>

        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="profile-summary">
            <p>Giriş yapan kullanıcı</p>
            <h2>{user.firstName} {user.lastName}</h2>
            <span>@{user.username}</span>
          </div>
          <dl className="profile-details">
            <div><dt>E-posta</dt><dd>{user.email}</dd></div>
            <div><dt>Hesap durumu</dt><dd>{user.isActive ? 'Aktif' : 'Pasif'}</dd></div>
            <div><dt>Kayıt tarihi</dt><dd>{dateFormatter.format(new Date(user.createdAt))}</dd></div>
          </dl>
        </div>
      </section>
    </main>
  )
}
