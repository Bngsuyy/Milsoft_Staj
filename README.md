# Task Management System

Kişisel görev yönetimi uygulaması. .NET 8 Web API backend'i ile React + PrimeReact frontend'inden oluşur.

Demo: [YouTube'da izle](https://www.youtube.com/watch?v=jcjtUVQBXxg)

## Proje yapısı

```text
Milsoft_Staj/
├── Backend/        (TaskManagement.API, TaskManagement.API.Tests)
├── Frontend/       (TaskManagement.Web)
├── Database/       (PostgreSQL ve Oracle kurulum scriptleri)
└── Documentation/  (API ve veritabanı dokümantasyonu)
```

## Durum

- **Backend**: kullanıcı kaydı/girişi, JWT, profil görüntüleme ve güncelleme, görev ve kategori CRUD,
  arama/filtreleme/sayfalama, toplu durum güncelleme ve toplu silme, yorum, dosya ekleme, istatistik
  ve vadesi geçen görev uçları hazır.
- **Database**: PostgreSQL migration'ları uygulanabilir; PostgreSQL ve Oracle için temiz kurulum
  scriptleri bulunur.
- **Frontend**: giriş/kayıt, dashboard (istatistik kartları ve durum grafiği), görev listesi
  (DataTable + satır içi düzenleme + çoklu seçim), Kanban pano görünümü (sürükle-bırak ile durum
  değiştirme), görev detayı (yorum ve dosya ekleri), kategori yönetimi, profil düzenleme,
  Excel/PDF dışa aktarma, yazdırma, klavye kısayolları ve açık/koyu tema desteği hazır.

> Dışa aktarma tek seferde en fazla 1000 görev alır. Sınır aşılırsa arayüz uyarı gösterir;
> daha dar filtre uygulayarak veya listeden seçim yaparak tam çıktı alınabilir.

## Backend'i çalıştırma

### Gizli bilgiler

Veritabanı parolası ve JWT anahtarı **depoda tutulmaz**. `appsettings.json` içindeki
`JwtSettings:SecretKey` boştur; değer verilmezse uygulama açılışta anlamlı bir hatayla durur.
Değerleri .NET User Secrets ile verin (önerilen):

```powershell
cd Backend/TaskManagement.API
dotnet user-secrets set "ConnectionStrings:PostgreSQL" "Host=localhost;Port=5432;Database=TaskManagementDb;Username=postgres;Password=YOUR_PASSWORD"
dotnet user-secrets set "JwtSettings:SecretKey" "EN_AZ_32_BAYTLIK_GELISTIRME_ANAHTARI"
```

Alternatif olarak ortam değişkeni kullanılabilir:

```powershell
$env:ConnectionStrings__PostgreSQL='Host=localhost;Port=5432;Database=TaskManagementDb;Username=postgres;Password=YOUR_PASSWORD'
$env:JwtSettings__SecretKey='EN_AZ_32_BAYTLIK_GELISTIRME_ANAHTARI'
```

Production'da bu değerler ortam değişkeni veya bir secret yöneticisi üzerinden sağlanmalıdır.

AutoMapper 15+ çift lisanslıdır. Üretim ortamında kuruluşunuza ait lisans anahtarını depoya
yazmadan `AUTOMAPPER_LICENSE_KEY` ortam değişkeniyle sağlayın. Lisans anahtarı uygulama
özelliklerini etkilemez; AutoMapper anahtarı yalnızca kendi lisans doğrulama günlüğü için okur.

### Çalıştırma

```powershell
dotnet ef database update --project Backend/TaskManagement.API/TaskManagement.API.csproj
dotnet run --project Backend/TaskManagement.API/TaskManagement.API.csproj --launch-profile http
```

Swagger: `http://localhost:5126/swagger`

Demo kullanıcı: `demouser` / `Demo123!`

### Backend testleri

```powershell
dotnet test Backend/TaskManagement.API.Tests/TaskManagement.API.Tests.csproj
dotnet list Backend/TaskManagement.API/TaskManagement.API.csproj package --vulnerable --include-transitive
```

Test paketi, PostgreSQL ve Oracle sağlayıcılarının aynı EF modelinden eksiksiz kurulum SQL'i
üretebildiğini de doğrular. Canlı Oracle kurulumu için `Documentation/Database_Design.md`
içindeki temiz kurulum adımlarını kullanın.

## Frontend'i çalıştırma

```powershell
cd Frontend/TaskManagement.Web
npm install
npm run dev
```

API adresi `Frontend/TaskManagement.Web/.env.development` içindeki `VITE_API_BASE_URL` ile ayarlanır.

### Frontend komutları

```powershell
npm run build   # tip kontrolü + production build
npm run lint    # ESLint
npm run test    # Vitest
npm audit --omit=dev # production bağımlılık güvenlik taraması
```

## Klavye kısayolları (Görevler ekranı)

| Kısayol | İşlev |
| --- | --- |
| `N` | Yeni görev oluştur |
| `/` | Arama kutusuna odaklan |
| `B` | Liste ve pano görünümü arasında geçiş |
| `R` | Listeyi yenile |
| `Ctrl` + `P` | Görev listesini yazdır |
| `?` | Kısayol yardımını aç |
| `Esc` | Filtreleri temizle |

## Dokümantasyon

- API uçları: `Documentation/API_Endpoints.md`
- Veritabanı tasarımı ve kurulumu: `Documentation/Database_Design.md`

## Tek komutla teslim doğrulaması

Gizli bilgi taraması, backend test/Release build, migration modeli, NuGet/npm güvenliği,
frontend test/lint ve production build kontrollerinin tamamını çalıştırmak için:

```powershell
.\scripts\Test-Delivery.ps1
```
