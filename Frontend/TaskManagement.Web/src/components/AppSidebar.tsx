import { NavLink } from 'react-router-dom'

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'pi-home', end: true },
  { to: '/tasks', label: 'Görevler', icon: 'pi-list-check', end: false },
  { to: '/categories', label: 'Kategoriler', icon: 'pi-tags', end: true },
  { to: '/profile', label: 'Profil', icon: 'pi-user', end: true },
]

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  return (
    <aside
      className={`app-sidebar${isOpen ? ' is-open' : ''}`}
      id="app-navigation"
      aria-label="Ana menü"
    >
      <div className="sidebar-brand-row">
        <NavLink className="sidebar-brand" to="/dashboard" onClick={onClose}>
          <span className="app-mark" aria-hidden="true">
            <img src="/favicon.svg?v=3" alt="MilSOFT" />
          </span>
          <span>
            <strong>Task Management</strong>
          </span>
        </NavLink>
        <button
          className="icon-button sidebar-close-button"
          type="button"
          aria-label="Menüyü kapat"
          onClick={onClose}
        >
          <i className="pi pi-times" aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-navigation">
        <span className="sidebar-section-label">Çalışma alanı</span>
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            end={item.end}
            key={item.to}
            to={item.to}
            onClick={onClose}
          >
            <i className={`pi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
