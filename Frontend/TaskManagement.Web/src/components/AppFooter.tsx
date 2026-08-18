const currentYear = new Date().getFullYear()

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>© {currentYear} Task Management System · .NET 8 Web API & React + PrimeReact</span>
      <span className="app-footer-hint">
        Kısayol yardımı için <kbd>?</kbd> tuşuna basın.
      </span>
    </footer>
  )
}
