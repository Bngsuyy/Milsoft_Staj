import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../pages/LoginPage'

const authMocks = vi.hoisted(() => ({ login: vi.fn() }))

vi.mock('../hooks', () => ({
  useAuth: () => ({ login: authMocks.login }),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard açıldı</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    authMocks.login.mockReset()
    authMocks.login.mockResolvedValue(undefined)
  })

  it('boş alanları API isteğinden önce doğrular', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(screen.getByText('Kullanıcı adı zorunludur.')).toBeInTheDocument()
    expect(screen.getByText('Şifre zorunludur.')).toBeInTheDocument()
    expect(authMocks.login).not.toHaveBeenCalled()
  })

  it('geçerli formu gönderip dashboard sayfasına yönlendirir', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.type(screen.getByLabelText('Kullanıcı adı'), '  demouser  ')
    await user.type(screen.getByLabelText('Şifre'), 'Demo123!')
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(authMocks.login).toHaveBeenCalledWith({
      username: 'demouser',
      password: 'Demo123!',
    })
    expect(await screen.findByText('Dashboard açıldı')).toBeInTheDocument()
  })
})
