import lightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url'
import darkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url'
import type { AppTheme } from '../contexts/ThemeContext'

export const THEME_STORAGE_KEY = 'task-management-theme'
const PRIME_THEME_LINK_ID = 'prime-theme'

function readStoredTheme(): AppTheme | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null
  } catch {
    return null
  }
}

export function getPreferredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'light'

  return readStoredTheme()
    ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

function updatePrimeTheme(theme: AppTheme) {
  const themeUrl = theme === 'dark' ? darkThemeUrl : lightThemeUrl
  let themeLink = document.getElementById(PRIME_THEME_LINK_ID) as HTMLLinkElement | null

  if (!themeLink) {
    themeLink = document.createElement('link')
    themeLink.id = PRIME_THEME_LINK_ID
    themeLink.rel = 'stylesheet'
    document.head.appendChild(themeLink)
  }

  if (themeLink.getAttribute('href') !== themeUrl) {
    themeLink.setAttribute('href', themeUrl)
  }
}

export function applyTheme(theme: AppTheme, persist = false) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#0f172a' : '#f6f8fc',
  )
  updatePrimeTheme(theme)

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Depolama kapalıysa tema yalnızca açık oturum boyunca uygulanır.
    }
  }
}
