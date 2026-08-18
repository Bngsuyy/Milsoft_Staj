import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { useAuth } from '../hooks'
import type { UpdateProfileRequest } from '../types'
import { getApiErrorMessage } from '../utils'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

type ProfileErrors = Partial<Record<keyof UpdateProfileRequest, string>>

interface ProfileFormState {
  firstName: string
  lastName: string
  email: string
}

function validate(form: ProfileFormState): ProfileErrors {
  const errors: ProfileErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!form.firstName.trim()) {
    errors.firstName = 'Ad zorunludur.'
  } else if (form.firstName.trim().length > 50) {
    errors.firstName = 'Ad en fazla 50 karakter olabilir.'
  }

  if (!form.lastName.trim()) {
    errors.lastName = 'Soyad zorunludur.'
  } else if (form.lastName.trim().length > 50) {
    errors.lastName = 'Soyad en fazla 50 karakter olabilir.'
  }

  if (!emailPattern.test(form.email.trim())) {
    errors.email = 'Geçerli bir e-posta adresi girin.'
  }

  return errors
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const toast = useRef<Toast>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ProfileFormState>({ firstName: '', lastName: '', email: '' })
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toLocaleUpperCase('tr-TR')

  function startEditing() {
    if (!user) return

    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email })
    setErrors({})
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setErrors({})
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      })
      setIsEditing(false)
      toast.current?.show({
        severity: 'success',
        summary: 'Profil güncellendi',
        detail: 'Hesap bilgilerin kaydedildi.',
      })
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Profil güncellenemedi',
        detail: getApiErrorMessage(error, 'Bilgiler kaydedilirken bir hata oluştu.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="content-page profile-page">
      <Toast ref={toast} position="top-right" />

      <section className="section-heading page-heading">
        <div>
          <span className="page-eyebrow">Hesabım</span>
          <h2>Profil</h2>
          <p>Hesap bilgilerini görüntüle ve güncelle.</p>
        </div>
        {!isEditing && (
          <Button label="Bilgileri düzenle" icon="pi pi-pencil" outlined onClick={startEditing} />
        )}
      </section>

      <section className="profile-panel">
        <div className="profile-panel-heading">
          <span className="profile-page-avatar" aria-hidden="true">{initials}</span>
          <div>
            <h3>{user.firstName} {user.lastName}</h3>
            <span>@{user.username}</span>
          </div>
        </div>

        {isEditing ? (
          <form className="profile-form" onSubmit={handleSubmit} noValidate>
            <div className="task-form-field">
              <label htmlFor="profile-first-name">Ad <span aria-hidden="true">*</span></label>
              <InputText
                id="profile-first-name"
                value={form.firstName}
                maxLength={50}
                autoFocus
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'profile-first-name-error' : undefined}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              />
              {errors.firstName && <small id="profile-first-name-error" className="field-error">{errors.firstName}</small>}
            </div>

            <div className="task-form-field">
              <label htmlFor="profile-last-name">Soyad <span aria-hidden="true">*</span></label>
              <InputText
                id="profile-last-name"
                value={form.lastName}
                maxLength={50}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? 'profile-last-name-error' : undefined}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              />
              {errors.lastName && <small id="profile-last-name-error" className="field-error">{errors.lastName}</small>}
            </div>

            <div className="task-form-field full-width-field">
              <label htmlFor="profile-email">E-posta <span aria-hidden="true">*</span></label>
              <InputText
                id="profile-email"
                type="email"
                value={form.email}
                maxLength={100}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'profile-email-error' : undefined}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
              {errors.email && <small id="profile-email-error" className="field-error">{errors.email}</small>}
            </div>

            <div className="task-form-actions full-width-field">
              <Button
                type="button"
                label="Vazgeç"
                severity="secondary"
                outlined
                disabled={isSubmitting}
                onClick={cancelEditing}
              />
              <Button type="submit" label="Değişiklikleri kaydet" icon="pi pi-check" loading={isSubmitting} />
            </div>
          </form>
        ) : (
          <dl className="profile-information">
            <div><dt>Ad Soyad</dt><dd>{user.firstName} {user.lastName}</dd></div>
            <div><dt>E-posta</dt><dd>{user.email}</dd></div>
            <div><dt>Hesap durumu</dt><dd><span className="active-badge">{user.isActive ? 'Aktif' : 'Pasif'}</span></dd></div>
            <div><dt>Kayıt tarihi</dt><dd>{dateFormatter.format(new Date(user.createdAt))}</dd></div>
          </dl>
        )}
      </section>
    </div>
  )
}
