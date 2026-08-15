export function LoadingScreen() {
  return (
    <main className="loading-screen" aria-busy="true" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>Oturum kontrol ediliyor...</p>
    </main>
  )
}
