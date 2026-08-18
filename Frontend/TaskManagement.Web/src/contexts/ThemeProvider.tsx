import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { applyTheme, getPreferredTheme } from '../utils/theme'
import { ThemeContext } from './ThemeContext'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState(getPreferredTheme)

  useEffect(() => {
    applyTheme(theme, true)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => current === 'light' ? 'dark' : 'light')
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
