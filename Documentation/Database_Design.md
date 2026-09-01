# Database Design

## Tablolar

- `Users`: kullanıcı ve BCrypt parola hash'i. `Username` ve `Email` benzersizdir.
  `ProfileImagePath` yüklenen profil görselinin göreli yolunu tutar (opsiyonel).
- `Categories`: kullanıcıya ait kategori. `(UserId, Name)` benzersizdir.
  `Icon` bir PrimeIcons sınıf adı (ör. `pi pi-tag`), `ImageUrl` ise kategori görselinin
  adresi veya gömülü data URI'sidir; ikisi de opsiyoneldir.
- `Tasks`: görev, öncelik, durum, tarih ve kategori ilişkisi.
- `TaskComments`: göreve ve yorum sahibine bağlı metin kayıtları.
- `TaskAttachments`: fiziksel dosyanın güvenli göreli yolu ve metadatası.

## İlişkiler ve silme davranışı

- User -> Categories: one-to-many, cascade delete.
- User -> Tasks: one-to-many, cascade delete.
- User -> TaskComments: one-to-many, cascade delete.
- Category -> Tasks: one-to-many, kategori silinince `CategoryId` null olur.
- Task -> TaskComments: one-to-many, cascade delete.
- Task -> TaskAttachments: one-to-many, cascade delete.

`Priority` için 1-5, `Status` için 0-3 check constraint'leri vardır ve `Priority` varsayılanı
`1` (Low)'dur. Görev sorguları için `(UserId, Status)` ve `(UserId, DueDate)` indeksleri kullanılır.
Kategori `Color` alanı temiz kurulum scriptlerinde 6 haneli HEX biçimiyle sınırlandırılmıştır;
API doğrulaması da aynı kuralı uygular.

Bir görev silindiğinde `TaskComments` ve `TaskAttachments` satırları cascade ile silinir;
`TaskAttachments` kayıtlarına ait fiziksel dosyalar da servis katmanında diskten kaldırılır.

## PostgreSQL

Mevcut proje veritabanını migration ile güncelleyin:

```powershell
dotnet ef database update --project Backend/TaskManagement.API/TaskManagement.API.csproj
```

Temiz ve migration kullanmayan bir kurulum için:

```powershell
psql -U postgres -d TaskManagementDb -f Database/Scripts/01_Initial_Schema_PostgreSQL.sql
```

## Oracle

Oracle servisi ve kullanıcı şeması hazırlandıktan sonra `Database/Scripts/02_Initial_Schema_Oracle.sql` dosyasını SQL*Plus veya SQL Developer ile çalıştırın. Ardından:

```text
DatabaseProvider=Oracle
ConnectionStrings__Oracle=User Id=taskmanagement;Password=...;Data Source=localhost:1521/XEPDB1
```

EF migration dosyaları PostgreSQL provider'ı ile üretilmiştir. Oracle temiz kurulumu için Oracle scripti kullanılmalıdır; runtime `UseOracle` üzerinden aynı entity modelini kullanır.

### Sağlayıcı uyumluluk testi

Backend test paketi, hem Npgsql hem Oracle EF Core sağlayıcısıyla modeli yükler ve beş tablonun
tam kurulum SQL'inin üretilebildiğini doğrular. Bu test veritabanı bağlantısı gerektirmez:

```powershell
dotnet test Backend/TaskManagement.API.Tests/TaskManagement.API.Tests.csproj
```

Canlı ortam kabulünde ayrıca ilgili Oracle şemasına `02_Initial_Schema_Oracle.sql` uygulanmalı ve
API, `DatabaseProvider=Oracle` yapılandırmasıyla çalıştırılmalıdır.

## Bağlantı bilgileri

Parolalar depoda saklanmaz. `appsettings.Development.json` yalnızca parolasız bağlantı
dizelerini içerir; parola ve JWT anahtarı User Secrets veya ortam değişkeni ile verilir
(bkz. depo kökündeki `README.md`).

## Seed

Her iki kurulumda demo kullanıcı bulunur:

- Username: `demouser`
- Password: `Demo123!`
