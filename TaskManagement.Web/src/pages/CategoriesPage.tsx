export function CategoriesPage() {
  return (
    <div className="content-page">
      <section className="section-heading page-heading">
        <div>
          <span className="page-eyebrow">Düzenleme</span>
          <h2>Kategoriler</h2>
          <p>Kategori yönetimi için sayfa ve navigasyon bağlantısı hazırlandı.</p>
        </div>
        <button className="primary-action-button" type="button" disabled title="Kategori formu sonraki adımda eklenecek">
          <i className="pi pi-plus" aria-hidden="true" />
          Yeni kategori
        </button>
      </section>

      <section className="empty-state-card">
        <span className="empty-state-icon" aria-hidden="true"><i className="pi pi-tags" /></span>
        <h3>Kategori ekranı hazır</h3>
        <p>Kategori ekleme, düzenleme ve silme işlevleri bu alana bağlanacak.</p>
      </section>
    </div>
  )
}
