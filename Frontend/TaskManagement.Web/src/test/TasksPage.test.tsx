import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TasksPage } from '../pages/TasksPage'
import type { PagedResult, Task } from '../types'

const serviceMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getOverdue: vi.fn(),
  getCategories: vi.fn(),
}))

vi.mock('../services', () => ({
  taskService: {
    getAll: serviceMocks.getAll,
    getOverdue: serviceMocks.getOverdue,
  },
  categoryService: {
    getAll: serviceMocks.getCategories,
  },
}))

function emptyPage(): PagedResult<Task> {
  return {
    items: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  }
}

/** Kenar çubuğundaki "Görevler" bağlantısı TasksPage'i yeniden mount etmez. */
function renderWithSidebarLink(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Link to="/tasks">Kenar çubuğu görevler</Link>
      <Routes>
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TasksPage', () => {
  beforeEach(() => {
    serviceMocks.getAll.mockReset().mockResolvedValue(emptyPage())
    serviceMocks.getOverdue.mockReset().mockResolvedValue(emptyPage())
    serviceMocks.getCategories.mockReset().mockResolvedValue([])
  })

  it('vadesi geçen görünümünü URL parametresinden okur', async () => {
    renderWithSidebarLink('/tasks?view=overdue')

    expect(await screen.findByRole('heading', { name: 'Vadesi geçen görevler' })).toBeInTheDocument()
    await waitFor(() => expect(serviceMocks.getOverdue).toHaveBeenCalled())
    expect(serviceMocks.getAll).not.toHaveBeenCalled()
  })

  it('URL yeniden /tasks olduğunda vadesi geçen görünümünden çıkar', async () => {
    const user = userEvent.setup()
    renderWithSidebarLink('/tasks?view=overdue')

    await screen.findByRole('heading', { name: 'Vadesi geçen görevler' })
    await user.click(screen.getByRole('link', { name: 'Kenar çubuğu görevler' }))

    expect(await screen.findByRole('heading', { name: 'Görevler' })).toBeInTheDocument()
    await waitFor(() => expect(serviceMocks.getAll).toHaveBeenCalled())
  })

  it('durum filtresini URL parametresinden uygular', async () => {
    renderWithSidebarLink('/tasks?status=Completed')

    await waitFor(() => expect(serviceMocks.getAll).toHaveBeenCalled())
    expect(serviceMocks.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Completed' }),
    )
  })
})
