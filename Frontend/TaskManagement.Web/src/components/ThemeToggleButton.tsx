import { useTheme } from '../hooks/useTheme'

interface ThemeToggleButtonProps {
  className?: string
}

export function ThemeToggleButton({ className = '' }: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Açık temaya geç' : 'Koyu temaya geç'

  return (
    <button
      className={`theme-toggle-button ${className}`.trim()}
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      <i className={`pi ${isDark ? 'pi-sun' : 'pi-moon'}`} aria-hidden="true" />
    </button>
  )
}
