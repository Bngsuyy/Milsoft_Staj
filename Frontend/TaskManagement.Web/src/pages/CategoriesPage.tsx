import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Skeleton } from 'primereact/skeleton'
import { Toast } from 'primereact/toast'
import { CategoryFormDialog } from '../components'
import { categoryService } from '../services'
import type { Category } from '../types'
import { formatTaskDate, getApiErrorMessage } from '../utils'

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((first, second) => first.name.localeCompare(second.name, 'tr-TR'))
}

export function CategoriesPage() {
  const toast = useRef<Toast>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadCategories() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await categoryService.getAll()
        if (isActive) setCategories(response)
      } catch (error) {
        if (isActive) {
          setLoadError(getApiErrorMessage(error, 'Kategoriler yüklenemedi.'))
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadCategories()
    return () => {
      isActive = false
    }
  }, [refreshKey])

  function openCreateDialog() {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  function handleSaved(savedCategory: Category) {
    setCategories((current) => sortCategories(
      editingCategory
        ? current.map((category) => category.id === savedCategory.id ? savedCategory : category)
        : [...current, savedCategory],
    ))
    setIsFormOpen(false)
    setEditingCategory(null)
    toast.current?.show({
      severity: 'success',
      summary: editingCategory ? 'Kategori güncellendi' : 'Kategori oluşturuldu',
      detail: savedCategory.name,
    })
  }

  async function deleteCategory(category: Category) {
    try {
      await categoryService.delete(category.id)
      setCategories((current) => current.filter((item) => item.id !== category.id))
      toast.current?.show({
        severity: 'success',
        summary: 'Kategori silindi',
        detail: `${category.name} kategorisi kaldırıldı.`,
      })
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Kategori silinemedi',
        detail: getApiErrorMessage(error, 'Kategori silinirken bir hata oluştu.'),
      })
    }
  }

  function requestDelete(category: Category) {
    confirmDialog({
      header: 'Kategoriyi sil',
      message: `“${category.name}” kategorisi silinsin mi? Bu kategorideki görevler silinmez, kategorisiz olarak kalır.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, sil',
      rejectLabel: 'Vazgeç',
      acceptClassName: 'p-button-danger',
      accept: () => void deleteCategory(category),
    })
  }

  return (
    <div className="content-page categories-page">
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <section className="section-heading page-heading">
        <div>
          <span className="page-eyebrow">Düzenleme</span>
          <h2>Kategoriler</h2>
          <p>Görevlerini renklerle gruplandırmak için kategorilerini yönet.</p>
        </div>
        <Button label="Yeni kategori" icon="pi pi-plus" onClick={openCreateDialog} />
      </section>

      {loadError && (
        <div className="task-load-error" role="alert">
          <div>
            <i className="pi pi-exclamation-circle" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <Button label="Tekrar dene" icon="pi pi-refresh" outlined onClick={() => setRefreshKey((current) => current + 1)} />
        </div>
      )}

      {isLoading ? (
        <div className="category-grid" aria-label="Kategoriler yükleniyor" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="category-card category-skeleton" key={index}>
              <Skeleton width="3rem" height="3rem" borderRadius="0.8rem" />
              <Skeleton width="65%" height="1rem" />
              <Skeleton width="100%" height="0.75rem" />
              <Skeleton width="80%" height="0.75rem" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <section className="category-grid" aria-label={`${categories.length} kategori`}>
          {categories.map((category) => (
            <article className="category-card" key={category.id} style={{ borderTopColor: category.color }}>
              {category.imageUrl && (
                <div className="category-card-banner">
                  <img src={category.imageUrl} alt={category.name} className="category-card-banner-img" />
                </div>
              )}

              <div className="category-card-heading">
                <span
                  className="category-card-icon"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                    borderColor: `${category.color}35`,
                  }}
                  aria-hidden="true"
                >
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name} className="category-mini-icon-img" />
                  ) : (
                    <i className={category.icon || 'pi pi-tag'} />
                  )}
                </span>
                <div className="category-card-actions">
                  <Button
                    type="button"
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="secondary"
                    aria-label={`${category.name} kategorisini düzenle`}
                    tooltip="Düzenle"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => openEditDialog(category)}
                  />
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    aria-label={`${category.name} kategorisini sil`}
                    tooltip="Sil"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => requestDelete(category)}
                  />
                </div>
              </div>

              <div className="category-card-content">
                <div className="category-name-row">
                  <span className="category-color" style={{ backgroundColor: category.color }} aria-hidden="true" />
                  <h3>{category.name}</h3>
                </div>
                <p>{category.description || 'Bu kategori için açıklama eklenmemiş.'}</p>
              </div>

              <footer className="category-card-footer">
                <span className="category-card-task-count">
                  <i className="pi pi-list-check" aria-hidden="true" /> {category.taskCount ?? 0} görev
                </span>
                <div className="category-card-footer-meta">
                  <span className="category-hex-badge">{category.color.toUpperCase()}</span>
                  <time dateTime={category.createdAt}>{formatTaskDate(category.createdAt)}</time>
                </div>
              </footer>
            </article>
          ))}
        </section>
      ) : !loadError && (
        <section className="empty-state-card category-empty-state">
          <span className="empty-state-icon" aria-hidden="true"><i className="pi pi-tags" /></span>
          <h3>Henüz kategori yok</h3>
          <p>Görevlerini gruplandırmak için ilk kategorini oluştur.</p>
          <Button label="İlk kategoriyi oluştur" icon="pi pi-plus" onClick={openCreateDialog} />
        </section>
      )}

      {isFormOpen && (
        <CategoryFormDialog
          key={editingCategory?.id ?? 'new-category'}
          category={editingCategory}
          onHide={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
