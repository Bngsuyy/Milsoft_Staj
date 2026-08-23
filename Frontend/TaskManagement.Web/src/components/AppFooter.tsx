const currentYear = new Date().getFullYear()

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <img className="app-footer-logo" src="/favicon.svg?v=2" alt="" aria-hidden="true" />
        <div>
          <strong>MilSOFT Görev Yönetimi</strong>
          <span>© {currentYear} · Kurumsal görev yönetim sistemi</span>
        </div>
      </div>

      <div className="app-footer-meta" aria-label="Sistem durumu">
        <span><i className="pi pi-shield" aria-hidden="true" /> Güvenli çalışma alanı</span>
        <span className="app-footer-status">Sistem hazır</span>
      </div>
    </footer>
  )
}
