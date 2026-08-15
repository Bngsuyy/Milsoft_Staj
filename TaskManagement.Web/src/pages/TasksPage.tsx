export function TasksPage() {
  return (
    <div className="content-page">
      <section className="section-heading page-heading">
        <div>
          <span className="page-eyebrow">Görev yönetimi</span>
          <h2>Görevler</h2>
          <p>Görev listeleme, filtreleme ve CRUD işlemleri bir sonraki adımda bu alana bağlanacak.</p>
        </div>
        <button className="primary-action-button" type="button" disabled title="Görev formu sonraki adımda eklenecek">
          <i className="pi pi-plus" aria-hidden="true" />
          Yeni görev
        </button>
      </section>

      <section className="empty-state-card">
        <span className="empty-state-icon" aria-hidden="true"><i className="pi pi-list-check" /></span>
        <h3>Görev ekranı hazır</h3>
        <p>Layout ve rota tamamlandı. Sıradaki aşamada backend verileri burada listelenecek.</p>
      </section>
    </div>
  )
}
