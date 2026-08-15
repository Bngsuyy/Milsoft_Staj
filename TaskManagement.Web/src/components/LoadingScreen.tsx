export function LoadingScreen() {
  return (
    <main className="loading-screen" aria-busy="true" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>Uygulama yükleniyor...</p>
    </main>
  )
}
