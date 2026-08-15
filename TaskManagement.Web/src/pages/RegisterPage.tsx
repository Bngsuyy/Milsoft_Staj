import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import type { RegisterRequest } from '../types'
import { getApiErrorMessage } from '../utils'

interface RegisterForm extends RegisterRequest {
  confirmPassword: string
}

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>

const initialForm: RegisterForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
}

function validate(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (form.username.trim().length < 3) {
    errors.username = 'Kullanıcı adı en az 3 karakter olmalıdır.'
  }
  if (!emailPattern.test(form.email.trim())) {
    errors.email = 'Geçerli bir e-posta adresi girin.'
  }
  if (form.password.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır.'
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Şifreler eşleşmiyor.'
  }
  if (!form.firstName.trim()) {
    errors.firstName = 'Ad zorunludur.'
  }
  if (!form.lastName.trim()) {
    errors.lastName = 'Soyad zorunludur.'
  }

  return errors
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    setErrorMessage(null)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const request: RegisterRequest = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    }

    setIsSubmitting(true)
    try {
      await register(request)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Kayıt oluşturulamadı. Tekrar deneyin.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="auth-form-heading">
        <p className="auth-eyebrow">Yeni hesap</p>
        <h2>Hemen kayıt ol</h2>
        <p>Görevlerini düzenlemeye birkaç saniyede başla.</p>
      </div>

      {errorMessage && (
        <div className="form-alert" role="alert">
          <i className="pi pi-exclamation-circle" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="firstName">Ad</label>
            <div className="input-shell">
              <i className="pi pi-user" aria-hidden="true" />
              <input id="firstName" value={form.firstName} autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
            </div>
            {errors.firstName && <small>{errors.firstName}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="lastName">Soyad</label>
            <div className="input-shell">
              <i className="pi pi-user" aria-hidden="true" />
              <input id="lastName" value={form.lastName} autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
            </div>
            {errors.lastName && <small>{errors.lastName}</small>}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="registerUsername">Kullanıcı adı</label>
          <div className="input-shell">
            <i className="pi pi-at" aria-hidden="true" />
            <input id="registerUsername" value={form.username} autoComplete="username" aria-invalid={Boolean(errors.username)} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
          </div>
          {errors.username && <small>{errors.username}</small>}
        </div>

        <div className="form-field">
          <label htmlFor="email">E-posta</label>
          <div className="input-shell">
            <i className="pi pi-envelope" aria-hidden="true" />
            <input id="email" type="email" value={form.email} autoComplete="email" aria-invalid={Boolean(errors.email)} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </div>
          {errors.email && <small>{errors.email}</small>}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="registerPassword">Şifre</label>
            <div className="input-shell">
              <i className="pi pi-lock" aria-hidden="true" />
              <input id="registerPassword" type="password" value={form.password} autoComplete="new-password" aria-invalid={Boolean(errors.password)} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </div>
            {errors.password && <small>{errors.password}</small>}
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Şifre tekrarı</label>
            <div className="input-shell">
              <i className="pi pi-lock" aria-hidden="true" />
              <input id="confirmPassword" type="password" value={form.confirmPassword} autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </div>
            {errors.confirmPassword && <small>{errors.confirmPassword}</small>}
          </div>
        </div>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : <i className="pi pi-user-plus" aria-hidden="true" />}
          {isSubmitting ? 'Hesap oluşturuluyor...' : 'Hesap oluştur'}
        </button>
      </form>

      <p className="auth-switch">
        Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
      </p>
    </div>
  )
}
