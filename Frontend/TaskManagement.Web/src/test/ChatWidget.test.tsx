import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatWidget } from '../components/ChatWidget'

const serviceMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getOverdue: vi.fn(),
  getStatistics: vi.fn(),
}))

vi.mock('../hooks', () => ({
  useAuth: () => ({ user: { firstName: 'Gökberk' } }),
}))

vi.mock('../services', () => ({
  taskService: serviceMocks,
}))

describe('ChatWidget', () => {
  beforeEach(() => {
    serviceMocks.getAll.mockReset()
    serviceMocks.getOverdue.mockReset()
    serviceMocks.getStatistics.mockReset().mockResolvedValue({
      total: 8,
      pending: 2,
      inProgress: 3,
      completed: 2,
      cancelled: 1,
      overdue: 1,
    })
  })

  it('açılır ve hızlı görev özetini API üzerinden gösterir', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChatWidget />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Görev asistanını aç' }))
    expect(screen.getByRole('dialog', { name: 'Görev Asistanı' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Görev özeti/ }))

    await waitFor(() => expect(serviceMocks.getStatistics).toHaveBeenCalledOnce())
    expect(await screen.findByText(/Toplam 8 görevin var/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tüm görevleri aç/ })).toHaveAttribute('href', '/tasks')
  })
})
