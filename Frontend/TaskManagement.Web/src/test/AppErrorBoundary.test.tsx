import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from '../components/AppErrorBoundary'

let shouldThrow = true

function UnstableContent() {
  if (shouldThrow) throw new Error('Bileşen testi hatası')
  return <p>İçerik yeniden yüklendi</p>
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('bileşen hatasında güvenli ekran gösterir ve tekrar dener', async () => {
    const user = userEvent.setup()
    render(
      <AppErrorBoundary>
        <UnstableContent />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Bir şeyler ters gitti')

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Tekrar dene' }))

    expect(screen.getByText('İçerik yeniden yüklendi')).toBeInTheDocument()
  })
})
