import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { ThemeToggleButton } from './ThemeToggleButton'

interface AppHeaderProps {
  onMenuOpen: () => void
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/tasks') return 'Görevler'
  if (pathname.startsWith('/tasks/')) return 'Görev detayı'
  if (pathname === '/categories') return 'Kategoriler'
  if (pathname === '/profile') return 'Profil'
  return 'Sayfa bulunamadı'
}

export function AppHeader({ onMenuOpen }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isUserMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = `${user?.firstName.charAt(0) ?? ''}${user?.lastName.charAt(0) ?? ''}` || 'K'

  return (
    <header className="app-header">
      <div className="header-heading">
        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-controls="app-navigation"
          aria-label="Ana menüyü aç"
          onClick={onMenuOpen}
        >
          <i className="pi pi-bars" aria-hidden="true" />
        </button>
        <div>
          <span>Çalışma alanı</span>
          <h1>{getPageTitle(location.pathname)}</h1>
        </div>
      </div>

      <div className="header-actions">
        <ThemeToggleButton />
        <div className="user-menu" ref={menuRef}>
          <button
            className="user-menu-trigger"
            type="button"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsUserMenuOpen((current) => !current)}
          >
            <span className="header-avatar" aria-hidden="true">{initials.toLocaleUpperCase('tr-TR')}</span>
            <span className="user-menu-name">
              <strong>{user?.firstName} {user?.lastName}</strong>
              <small>@{user?.username}</small>
            </span>
            <i className={`pi ${isUserMenuOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`} aria-hidden="true" />
          </button>

          {isUserMenuOpen && (
            <div className="user-menu-panel" role="menu">
              <div className="user-menu-summary">
                <strong>{user?.firstName} {user?.lastName}</strong>
                <span>{user?.email}</span>
              </div>
              <Link
                className="user-menu-item"
                role="menuitem"
                to="/profile"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <i className="pi pi-user" aria-hidden="true" />
                Profilim
              </Link>
              <button className="user-menu-item danger" role="menuitem" type="button" onClick={handleLogout}>
                <i className="pi pi-sign-out" aria-hidden="true" />
                Çıkış yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
