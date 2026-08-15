import { useAuth } from '../hooks'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toLocaleUpperCase('tr-TR')

  return (
    <div className="content-page profile-page">
      <section className="section-heading page-heading">
        <div>
          <span className="page-eyebrow">Hesabım</span>
          <h2>Profil</h2>
          <p>Oturum açmış kullanıcıya ait hesap bilgileri.</p>
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-heading">
          <span className="profile-page-avatar" aria-hidden="true">{initials}</span>
          <div>
            <h3>{user.firstName} {user.lastName}</h3>
            <span>@{user.username}</span>
          </div>
        </div>
        <dl className="profile-information">
          <div><dt>E-posta</dt><dd>{user.email}</dd></div>
          <div><dt>Hesap durumu</dt><dd><span className="active-badge">{user.isActive ? 'Aktif' : 'Pasif'}</span></dd></div>
          <div><dt>Kayıt tarihi</dt><dd>{dateFormatter.format(new Date(user.createdAt))}</dd></div>
        </dl>
      </section>
    </div>
  )
}
