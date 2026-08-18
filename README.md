# Task Management System

Kişisel görev yönetimi uygulaması. .NET 8 Web API backend'i ile React + PrimeReact frontend'inden oluşur.

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

## Backend'i çalıştırma

Geliştirme bağlantı ayarlarını `Backend/TaskManagement.API/appsettings.Development.json` içinde
düzenleyin veya ortam değişkeni kullanın:

```powershell
$env:ConnectionStrings__PostgreSQL='Host=localhost;Port=5432;Database=TaskManagementDb;Username=postgres;Password=YOUR_PASSWORD'
$env:JwtSettings__SecretKey='YOUR_DEVELOPMENT_SECRET_WITH_AT_LEAST_32_BYTES'
dotnet ef database update --project Backend/TaskManagement.API/TaskManagement.API.csproj
dotnet run --project Backend/TaskManagement.API/TaskManagement.API.csproj --launch-profile http
```

Swagger: `http://localhost:5126/swagger`

Demo kullanıcı: `demouser` / `Demo123!`

### Backend testleri

```powershell
dotnet test Backend/TaskManagement.API.Tests/TaskManagement.API.Tests.csproj
```

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
