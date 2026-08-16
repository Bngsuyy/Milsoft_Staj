import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components'
import { AuthProvider, ThemeProvider } from './contexts'
import { applyTheme, getPreferredTheme } from './utils'

applyTheme(getPreferredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PrimeReactProvider value={{ ripple: true }}>
        <AppErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppErrorBoundary>
      </PrimeReactProvider>
    </ThemeProvider>
  </StrictMode>,
)
