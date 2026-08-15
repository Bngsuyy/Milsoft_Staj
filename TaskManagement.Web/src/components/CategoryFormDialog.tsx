import { useState } from 'react'
import type { FormEvent } from 'react'
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
}

const presetColors = [
  '#2563EB',
  '#0891B2',
  '#059669',
  '#65A30D',
  '#D97706',
  '#DC2626',
  '#DB2777',
  '#7C3AED',
]

const hexColorPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/

function getInitialForm(category?: Category | null): CategoryFormState {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    color: category?.color.toUpperCase() ?? '#2563EB',
  }
}

function normalizePickerColor(value: unknown): string {
  return typeof value === 'string' ? `#${value.replace(/^#/, '').toUpperCase()}` : '#2563EB'
}

export function CategoryFormDialog({ category, onHide, onSaved }: CategoryFormDialogProps) {
  const [form, setForm] = useState(() => getInitialForm(category))
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(category)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = form.name.trim()
    const description = form.description.trim()
    const color = form.color.trim().toUpperCase()

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
      setValidationError('Geçerli bir HEX renk kodu girin. Örnek: #2563EB')
      return
    }

    setValidationError(null)
    setIsSubmitting(true)

    try {
      const request = {
        name,
        description: description || null,
        color,
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
      style={{ width: '36rem' }}
      breakpoints={{ '640px': 'calc(100vw - 2rem)' }}
      onHide={onHide}
    >
      <form className="category-form" onSubmit={handleSubmit} noValidate>
        {validationError && (
          <div className="task-form-error" role="alert">
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="task-form-field">
          <label htmlFor="category-name">Kategori adı <span aria-hidden="true">*</span></label>
          <InputText
            id="category-name"
            value={form.name}
            maxLength={100}
            autoFocus
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
            rows={4}
            maxLength={500}
            autoResize
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <small>{form.description.length}/500</small>
        </div>

        <fieldset className="category-color-field">
          <legend>Kategori rengi</legend>
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
