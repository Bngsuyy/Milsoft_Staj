import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader, AppSidebar } from '../components'

export function RootLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMobileMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileMenuOpen])

  return (
    <div className={`app-shell${isMobileMenuOpen ? ' has-open-menu' : ''}`}>
      <AppSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {isMobileMenuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className="app-workspace">
        <AppHeader onMenuOpen={() => setIsMobileMenuOpen(true)} />
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
