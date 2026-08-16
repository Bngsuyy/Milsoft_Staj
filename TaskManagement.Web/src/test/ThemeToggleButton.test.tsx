import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { ThemeProvider } from '../contexts/ThemeProvider'
import { THEME_STORAGE_KEY } from '../utils/theme'

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.getElementById('prime-theme')?.remove()
  })

  it('temayı değiştirir ve tercihi saklar', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>,
    )

    expect(screen.getByRole('button', { name: 'Koyu temaya geç' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Koyu temaya geç' }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('button', { name: 'Açık temaya geç' })).toBeInTheDocument()
    expect(document.getElementById('prime-theme')).toHaveAttribute('rel', 'stylesheet')
  })
})
