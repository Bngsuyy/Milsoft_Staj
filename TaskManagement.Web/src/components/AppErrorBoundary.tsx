import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uygulama arayüzünde beklenmeyen hata:', error, errorInfo)
  }

  private retry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="fatal-error-page">
        <section className="fatal-error-card" role="alert">
          <span className="fatal-error-icon" aria-hidden="true">
            <i className="pi pi-exclamation-triangle" />
          </span>
          <p className="page-eyebrow">Beklenmeyen hata</p>
          <h1>Bir şeyler ters gitti</h1>
          <p>Sayfa görüntülenirken beklenmeyen bir sorun oluştu. Yeniden deneyebilirsiniz.</p>
          <div className="fatal-error-actions">
            <button type="button" className="primary-action-button" onClick={this.retry}>
              <i className="pi pi-refresh" aria-hidden="true" />
              Tekrar dene
            </button>
            <a className="back-link" href="/">Ana sayfaya dön</a>
          </div>
        </section>
      </main>
    )
  }
}
