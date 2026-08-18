import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from '../pages/ProfilePage'
import type { User } from '../types'

const authMocks = vi.hoisted(() => ({ updateProfile: vi.fn() }))

const demoUser: User = {
  id: 'user-1',
  username: 'demouser',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  isActive: true,
  createdAt: '2026-01-15T09:00:00Z',
}

vi.mock('../hooks', () => ({
  useAuth: () => ({ user: demoUser, updateProfile: authMocks.updateProfile }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    authMocks.updateProfile.mockReset().mockResolvedValue(demoUser)
  })

  it('hesap bilgilerini salt okunur olarak listeler', () => {
    render(<ProfilePage />)

    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bilgileri düzenle' })).toBeInTheDocument()
  })

  it('geçersiz e-posta ile API isteği göndermez', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Bilgileri düzenle' }))
    const emailInput = screen.getByLabelText(/E-posta/)
    await user.clear(emailInput)
    await user.type(emailInput, 'gecersiz-eposta')
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }))

    expect(screen.getByText('Geçerli bir e-posta adresi girin.')).toBeInTheDocument()
    expect(authMocks.updateProfile).not.toHaveBeenCalled()
  })

  it('geçerli formu kırpılmış değerlerle gönderir', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Bilgileri düzenle' }))
    const firstNameInput = screen.getByLabelText(/Ad /)
    await user.clear(firstNameInput)
    await user.type(firstNameInput, '  Gökberk  ')
    await user.click(screen.getByRole('button', { name: 'Değişiklikleri kaydet' }))

    expect(authMocks.updateProfile).toHaveBeenCalledWith({
      firstName: 'Gökberk',
      lastName: 'User',
      email: 'demo@example.com',
    })
  })
})
