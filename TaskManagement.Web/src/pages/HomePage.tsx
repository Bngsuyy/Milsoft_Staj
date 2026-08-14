import { API_BASE_URL } from '../utils'

const foundations = [
  {
    icon: 'pi pi-sitemap',
    title: 'React Router',
    detail: 'Ana rota ve 404 akışı hazır.',
  },
  {
    icon: 'pi pi-palette',
    title: 'Prime altyapısı',
    detail: 'PrimeReact provider, PrimeFlex ve PrimeIcons bağlı.',
  },
  {
    icon: 'pi pi-server',
    title: 'API adresi',
    detail: API_BASE_URL,
  },
]

export function HomePage() {
  return (
    <main className="app-page flex align-items-center justify-content-center">
      <section className="foundation-card" aria-labelledby="foundation-title">
        <div className="foundation-hero">
          <div className="flex align-items-center gap-3">
            <span className="app-mark inline-flex align-items-center justify-content-center">
              <i className="pi pi-check-square" aria-hidden="true" />
            </span>
            <span className="status-pill">Frontend altyapısı hazır</span>
          </div>

          <h1 id="foundation-title" className="foundation-title">
            Task Management System
          </h1>
          <p className="foundation-copy">
            Vite örnek ekranı kaldırıldı. Proje artık authentication ve görev yönetimi
            özelliklerini eklemek için temiz bir başlangıç noktasında.
          </p>
        </div>

        <div className="foundation-grid grid">
          {foundations.map((item) => (
            <div className="col-12 md:col-4" key={item.title}>
              <article className="foundation-item">
                <i className={item.icon} aria-hidden="true" />
                <h2>{item.title}</h2>
                {item.title === 'API adresi' ? <code>{item.detail}</code> : <p>{item.detail}</p>}
              </article>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
