import { Link } from 'react-router-dom'
import { useAuth } from '../hooks'

const quickLinks = [
  {
    to: '/tasks',
    icon: 'pi-list-check',
    title: 'Görevler',
    description: 'Görevlerini görüntüle, filtrele ve yönet.',
  },
  {
    to: '/categories',
    icon: 'pi-tags',
    title: 'Kategoriler',
    description: 'Görevlerini düzenlemek için kategorileri kullan.',
  },
  {
    to: '/profile',
    icon: 'pi-user',
    title: 'Profil',
    description: 'Hesap bilgilerini görüntüle ve güncelle.',
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="content-page dashboard-content-page">
      <section className="welcome-panel">
        <div>
          <span className="page-eyebrow">Hoş geldin</span>
          <h2>{user?.firstName}, bugün ne yapmak istersin?</h2>
          <p>Görevlerini tek çalışma alanından planlayabilir ve takip edebilirsin.</p>
        </div>
        <span className="welcome-panel-icon" aria-hidden="true">
          <i className="pi pi-sparkles" />
        </span>
      </section>

      <section aria-labelledby="quick-links-title">
        <div className="section-heading">
          <div>
            <span className="page-eyebrow">Kısayollar</span>
            <h2 id="quick-links-title">Çalışma alanın</h2>
          </div>
        </div>
        <div className="quick-link-grid">
          {quickLinks.map((item) => (
            <Link className="quick-link-card" key={item.to} to={item.to}>
              <span className="quick-link-icon" aria-hidden="true">
                <i className={`pi ${item.icon}`} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <i className="pi pi-arrow-right quick-link-arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
