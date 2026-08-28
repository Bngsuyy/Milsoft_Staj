import { useState, useRef } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from 'primereact/button'
import { ColorPicker } from 'primereact/colorpicker'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { categoryService } from '../services'
import type { Category } from '../types'
import { getApiErrorMessage } from '../utils'

interface CategoryFormDialogProps {
  category?: Category | null
  onHide: () => void
  onSaved: (category: Category) => void
}

interface CategoryFormState {
  name: string
  description: string
  color: string
  icon: string
  imageUrl: string
}

const presetColors = [
  '#C4162A', // MilSOFT Red
  '#2563EB', // Blue
  '#0891B2', // Cyan
  '#059669', // Emerald
  '#65A30D', // Lime/Green
  '#D97706', // Amber
  '#EA580C', // Orange
  '#DC2626', // Crimson
  '#DB2777', // Pink
  '#7C3AED', // Purple
  '#4F46E5', // Indigo
  '#475569', // Slate
]

const iconCategories = [
  {
    category: 'Proje & Teknoloji',
    icons: [
      { id: 'pi pi-send', label: 'Roket / Teknoloji' },
      { id: 'pi pi-bolt', label: 'Enerji / Hızlı' },
      { id: 'pi pi-code', label: 'Yazılım' },
      { id: 'pi pi-desktop', label: 'Sistem / Cihaz' },
      { id: 'pi pi-database', label: 'Veritabanı' },
      { id: 'pi pi-shield', label: 'Savunma / Güvenlik' },
    ],
  },
  {
    category: 'İş & Yönetim',
    icons: [
      { id: 'pi pi-briefcase', label: 'İş / Ofis' },
      { id: 'pi pi-flag', label: 'Hedef / Kilometre Taşı' },
      { id: 'pi pi-chart-bar', label: 'Analiz' },
      { id: 'pi pi-chart-line', label: 'Performans' },
      { id: 'pi pi-users', label: 'Ekip / Toplantı' },
      { id: 'pi pi-calendar', label: 'Planlama' },
    ],
  },
  {
    category: 'Genel & Kişisel',
    icons: [
      { id: 'pi pi-tag', label: 'Etiket' },
      { id: 'pi pi-tags', label: 'Koleksiyon' },
      { id: 'pi pi-star', label: 'Yıldız / Önemli' },
      { id: 'pi pi-bookmark', label: 'Yer İmi' },
      { id: 'pi pi-check-circle', label: 'Tamamlama' },
      { id: 'pi pi-book', label: 'Eğitim / Doküman' },
      { id: 'pi pi-palette', label: 'Tasarım' },
      { id: 'pi pi-home', label: 'Kişisel' },
      { id: 'pi pi-heart', label: 'Öncelikli' },
      { id: 'pi pi-shopping-bag', label: 'Satın Alma' },
      { id: 'pi pi-cog', label: 'Ayarlar / Bakım' },
    ],
  },
]

const hexColorPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/

function getInitialForm(category?: Category | null): CategoryFormState {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    color: category?.color.toUpperCase() ?? '#C4162A',
    icon: category?.icon ?? 'pi pi-tag',
    imageUrl: category?.imageUrl ?? '',
  }
}

function normalizePickerColor(value: unknown): string {
  return typeof value === 'string' ? `#${value.replace(/^#/, '').toUpperCase()}` : '#C4162A'
}

function compressImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(format, quality))
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function CategoryFormDialog({ category, onHide, onSaved }: CategoryFormDialogProps) {
  const [form, setForm] = useState(() => getInitialForm(category))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visualMode, setVisualMode] = useState<'icon' | 'image'>(category?.imageUrl ? 'image' : 'icon')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = Boolean(category)

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setValidationError('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, SVG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Seçilen görsel 5 MB boyutundan küçük olmalıdır.')
      return
    }

    try {
      const compressedDataUrl = await compressImage(file)
      setForm((current) => ({ ...current, imageUrl: compressedDataUrl }))
      setValidationError(null)
    } catch {
      setValidationError('Görsel işlenirken bir hata oluştu.')
    }
  }

  function handleRemoveImage() {
    setForm((current) => ({ ...current, imageUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = form.name.trim()
    const description = form.description.trim()
    const color = form.color.trim().toUpperCase()
    const icon = visualMode === 'icon' ? form.icon.trim() : null
    const imageUrl = visualMode === 'image' && form.imageUrl.trim() ? form.imageUrl.trim() : null

    if (!name) {
      setValidationError('Kategori adı zorunludur.')
      return
    }

    if (name.length > 100) {
      setValidationError('Kategori adı en fazla 100 karakter olabilir.')
      return
    }

    if (description.length > 500) {
      setValidationError('Açıklama en fazla 500 karakter olabilir.')
      return
    }

    if (!hexColorPattern.test(color)) {
      setValidationError('Geçerli bir HEX renk kodu girin. Örnek: #C4162A')
      return
    }

    setValidationError(null)
    setIsSubmitting(true)

    try {
      const request = {
        name,
        description: description || null,
        color,
        icon: icon || null,
        imageUrl: imageUrl || null,
      }
      const savedCategory = category
        ? await categoryService.update(category.id, request)
        : await categoryService.create(request)

      onSaved(savedCategory)
    } catch (error) {
      setValidationError(getApiErrorMessage(error, 'Kategori kaydedilemedi.'))
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      className="category-form-dialog"
      header={isEditing ? 'Kategoriyi düzenle' : 'Yeni kategori oluştur'}
      visible
      modal
      draggable={false}
      closable={!isSubmitting}
      closeOnEscape={!isSubmitting}
      style={{ width: '42rem' }}
      breakpoints={{ '768px': 'calc(100vw - 2rem)' }}
      onHide={onHide}
    >
      <form className="category-form" onSubmit={handleSubmit} noValidate>
        {validationError && (
          <div className="task-form-error" role="alert">
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Live Preview Card */}
        <div className="category-preview-card" style={{ borderLeftColor: form.color }}>
          <div className="category-preview-badge" style={{ backgroundColor: `${form.color}18`, color: form.color }}>
            {visualMode === 'image' && form.imageUrl ? (
              <img src={form.imageUrl} alt={form.name || 'Önizleme'} className="category-preview-img" />
            ) : (
              <i className={form.icon || 'pi pi-tag'} style={{ fontSize: '1.4rem' }} />
            )}
          </div>
          <div className="category-preview-info">
            <div className="category-preview-name-row">
              <span className="category-color" style={{ backgroundColor: form.color }} />
              <strong>{form.name || 'Kategori Adı'}</strong>
            </div>
            <p>{form.description || 'Kategori açıklaması burada görünecektir.'}</p>
          </div>
        </div>

        <div className="task-form-field">
          <label htmlFor="category-name">Kategori adı <span aria-hidden="true">*</span></label>
          <InputText
            id="category-name"
            value={form.name}
            maxLength={100}
            autoFocus
            placeholder="Örn: Teknofest, İş / Proje, AR-GE"
            aria-invalid={Boolean(validationError && !form.name.trim())}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <small>{form.name.length}/100</small>
        </div>

        <div className="task-form-field">
          <label htmlFor="category-description">Açıklama</label>
          <InputTextarea
            id="category-description"
            value={form.description}
            rows={3}
            maxLength={500}
            autoResize
            placeholder="Kategori hakkında kısa açıklama..."
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <small>{form.description.length}/500</small>
        </div>

        {/* Visual / Icon / Image Selector Section */}
        <fieldset className="category-visual-field">
          <legend>Kategori Görseli / İkonu</legend>
          <div className="category-visual-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${visualMode === 'icon' ? 'is-active' : ''}`}
              onClick={() => setVisualMode('icon')}
            >
              <i className="pi pi-th-large" /> İkon Seç
            </button>
            <button
              type="button"
              className={`mode-btn ${visualMode === 'image' ? 'is-active' : ''}`}
              onClick={() => setVisualMode('image')}
            >
              <i className="pi pi-image" /> Resim Yükle / URL
            </button>
          </div>

          {visualMode === 'icon' ? (
            <div className="category-icon-picker">
              {iconCategories.map((group) => (
                <div key={group.category} className="category-icon-group">
                  <span className="category-icon-group-title">{group.category}</span>
                  <div className="category-icon-grid">
                    {group.icons.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`category-icon-option ${form.icon === item.id ? 'is-selected' : ''}`}
                        style={form.icon === item.id ? { borderColor: form.color, backgroundColor: `${form.color}15`, color: form.color } : {}}
                        title={item.label}
                        onClick={() => setForm((current) => ({ ...current, icon: item.id }))}
                      >
                        <i className={item.id} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="category-image-uploader">
              {form.imageUrl ? (
                <div className="category-image-preview-box">
                  <img src={form.imageUrl} alt="Kategori görseli" className="uploaded-cat-img" />
                  <div className="image-preview-actions">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      label="Görseli Kaldır"
                      severity="danger"
                      outlined
                      size="small"
                      onClick={handleRemoveImage}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="category-drop-area"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Kategori görseli yükle"
                  onKeyDown={(event) => {
                    // Klavye kullanıcıları da alanı Enter/Space ile açabilmeli.
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <i className="pi pi-upload drop-icon" style={{ color: form.color }} />
                  <strong>Görsel Yüklemek İçin Tıklayın</strong>
                  <span>PNG, JPG, SVG veya WebP (Otomatik optimize edilir)</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />

              <div className="task-form-field" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="category-image-url">veya Doğrudan Resim URL'si</label>
                <InputText
                  id="category-image-url"
                  value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                  placeholder={form.imageUrl.startsWith('data:') ? '✓ Görsel dosyası yüklendi' : 'https://example.com/logo.png'}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* Color Section */}
        <fieldset className="category-color-field">
          <legend>Kategori Rengi</legend>
          <div className="category-color-control">
            <ColorPicker
              inputId="category-color-picker"
              value={form.color.replace(/^#/, '')}
              format="hex"
              onChange={(event) => setForm((current) => ({
                ...current,
                color: normalizePickerColor(event.value),
              }))}
            />
            <span className="category-color-preview" style={{ backgroundColor: hexColorPattern.test(form.color) ? form.color : '#FFFFFF' }} aria-hidden="true" />
            <InputText
              id="category-color-code"
              value={form.color}
              maxLength={7}
              aria-label="HEX renk kodu"
              onChange={(event) => setForm((current) => ({ ...current, color: event.target.value.toUpperCase() }))}
            />
          </div>
          <div className="category-color-presets" aria-label="Hazır renkler">
            {presetColors.map((color) => (
              <button
                className={form.color === color ? 'is-selected' : ''}
                key={color}
                type="button"
                style={{ backgroundColor: color }}
                aria-label={`${color} rengini seç`}
                aria-pressed={form.color === color}
                onClick={() => setForm((current) => ({ ...current, color }))}
              />
            ))}
          </div>
        </fieldset>

        <div className="task-form-actions">
          <Button
            type="button"
            label="Vazgeç"
            severity="secondary"
            outlined
            disabled={isSubmitting}
            onClick={onHide}
          />
          <Button
            type="submit"
            label={isEditing ? 'Değişiklikleri kaydet' : 'Kategoriyi oluştur'}
            icon="pi pi-check"
            loading={isSubmitting}
          />
        </div>
      </form>
    </Dialog>
  )
}
