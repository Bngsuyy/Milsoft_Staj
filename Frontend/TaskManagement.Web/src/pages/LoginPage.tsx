import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import type { LoginRequest } from '../types'
import { getApiErrorMessage } from '../utils'

type LoginErrors = Partial<Record<keyof LoginRequest, string>>

interface LoginLocationState {
  from?: {
    pathname: string
    search?: string
    hash?: string
  }
}

const initialForm: LoginRequest = {
  username: '',
  password: '',
}

function validate(form: LoginRequest): LoginErrors {
  const errors: LoginErrors = {}

  if (!form.username.trim()) {
    errors.username = 'Kullanıcı adı zorunludur.'
  }
  if (!form.password) {
    errors.password = 'Şifre zorunludur.'
  }

  return errors
}

function safeReturnUrl(candidate: string | null): string | null {
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : null
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function getRedirectTarget(): string {
    const state = location.state as LoginLocationState | null
    const from = state?.from
    const stateTarget = from
      ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
      : null
    const queryTarget = new URLSearchParams(location.search).get('returnUrl')

    return safeReturnUrl(stateTarget) ?? safeReturnUrl(queryTarget) ?? '/dashboard'
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    setErrorMessage(null)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await login({ username: form.username.trim(), password: form.password })
      navigate(getRedirectTarget(), { replace: true })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Giriş yapılamadı. Bilgilerinizi kontrol edin.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function fillDemoAccount() {
    setForm({ username: 'demouser', password: 'Demo123!' })
    setErrors({})
    setErrorMessage(null)
  }

  return (
    <div>
      <div className="auth-form-heading">
        <p className="auth-eyebrow">Tekrar hoş geldin</p>
        <h2>Hesabına giriş yap</h2>
        <p>Görevlerine kaldığın yerden devam et.</p>
      </div>

      {errorMessage && (
        <div className="form-alert" role="alert">
          <i className="pi pi-exclamation-circle" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Kullanıcı adı</label>
          <div className="input-shell">
            <i className="pi pi-user" aria-hidden="true" />
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
            />
          </div>
          {errors.username && <small id="username-error">{errors.username}</small>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Şifre</label>
          <div className="input-shell">
            <i className="pi pi-lock" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </div>
          {errors.password && <small id="password-error">{errors.password}</small>}
        </div>

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <span className="button-spinner" aria-hidden="true" /> : <i className="pi pi-sign-in" aria-hidden="true" />}
          {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş yap'}
        </button>
      </form>

      <button className="demo-account" type="button" onClick={fillDemoAccount}>
        <i className="pi pi-sparkles" aria-hidden="true" />
        Demo hesabını doldur: demouser / Demo123!
      </button>

      <p className="auth-switch">
        Hesabın yok mu? <Link to="/register">Ücretsiz kayıt ol</Link>
      </p>
    </div>
  )
}
