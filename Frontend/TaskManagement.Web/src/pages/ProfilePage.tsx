import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { UserAvatar } from '../components'
import { useAuth } from '../hooks'
import type { UpdateProfileRequest } from '../types'
import { getApiErrorMessage } from '../utils'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024
const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
  const { user, updateProfile, uploadProfileImage, deleteProfileImage } = useAuth()
  const toast = useRef<Toast>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<ProfileFormState>({ firstName: '', lastName: '', email: '' })
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPhotoSubmitting, setIsPhotoSubmitting] = useState(false)

  if (!user) return null

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

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Desteklenmeyen görsel',
        detail: 'JPG, PNG veya WebP formatında bir fotoğraf seçin.',
      })
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Dosya çok büyük',
        detail: 'Profil fotoğrafı en fazla 5 MB olabilir.',
      })
      return
    }

    setIsPhotoSubmitting(true)
    try {
      await uploadProfileImage(file)
      toast.current?.show({
        severity: 'success',
        summary: 'Fotoğraf güncellendi',
        detail: 'Yeni profil fotoğrafın kaydedildi.',
      })
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fotoğraf yüklenemedi',
        detail: getApiErrorMessage(error, 'Profil fotoğrafı kaydedilirken bir hata oluştu.'),
      })
    } finally {
      setIsPhotoSubmitting(false)
    }
  }

  async function handlePhotoDelete() {
    setIsPhotoSubmitting(true)
    try {
      await deleteProfileImage()
      toast.current?.show({
        severity: 'success',
        summary: 'Fotoğraf kaldırıldı',
        detail: 'Baş harf avatarın yeniden etkinleştirildi.',
      })
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Fotoğraf kaldırılamadı',
        detail: getApiErrorMessage(error, 'Profil fotoğrafı kaldırılırken bir hata oluştu.'),
      })
    } finally {
      setIsPhotoSubmitting(false)
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
          <div className="profile-avatar-shell">
            <UserAvatar user={user} className="profile-page-avatar" />
          </div>
          <div className="profile-identity">
            <h3>{user.firstName} {user.lastName}</h3>
            <span>@{user.username}</span>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Profil fotoğrafı seç"
              hidden
              onChange={handlePhotoSelected}
            />
            <div className="profile-photo-actions">
              <Button
                type="button"
                label={user.profileImageUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}
                icon="pi pi-camera"
                size="small"
                outlined
                loading={isPhotoSubmitting}
                disabled={isPhotoSubmitting}
                onClick={() => photoInput.current?.click()}
              />
              {user.profileImageUrl && (
                <Button
                  type="button"
                  label="Fotoğrafı kaldır"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  disabled={isPhotoSubmitting}
                  onClick={handlePhotoDelete}
                />
              )}
            </div>
            <small className="profile-photo-hint">JPG, PNG veya WebP · En fazla 5 MB</small>
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
