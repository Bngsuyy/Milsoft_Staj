# Task Management System

Kişisel görev yönetimi uygulamasının .NET 8 Web API ve React/PrimeReact kaynak kodları.

## Durum

- Backend: kullanıcı kaydı/girişi, JWT, profil, görev ve kategori CRUD, arama/filtreleme/sayfalama, yorum, dosya, istatistik ve vadesi geçen görev uçları hazır.
- Database: PostgreSQL migration'ları uygulanabilir; PostgreSQL ve Oracle için temiz kurulum scriptleri bulunur.
- Frontend: React/Vite/TypeScript paketleri kurulu, ancak ekranlar henüz Vite başlangıç şablonudur.

## Backend'i çalıştırma

Geliştirme bağlantı ayarlarını `Backend/TaskManagement.API/appsettings.Development.json` içinde düzenleyin veya ortam değişkeni kullanın:

```powershell
$env:ConnectionStrings__PostgreSQL='Host=localhost;Port=5432;Database=TaskManagementDb;Username=postgres;Password=YOUR_PASSWORD'
$env:JwtSettings__SecretKey='YOUR_DEVELOPMENT_SECRET_WITH_AT_LEAST_32_BYTES'
dotnet ef database update --project Backend/TaskManagement.API/TaskManagement.API.csproj
dotnet run --project Backend/TaskManagement.API/TaskManagement.API.csproj --launch-profile http
```

Swagger: `http://localhost:5126/swagger`

Demo kullanıcı: `demouser` / `Demo123!`

## Testler

```powershell
dotnet test Backend/TaskManagement.API.Tests/TaskManagement.API.Tests.csproj
```

## Frontend'i çalıştırma

```powershell
cd TaskManagement.Web
npm install
npm run dev
```

API ayrıntıları için `Documentation/API_Endpoints.md`, veritabanı ayrıntıları için `Documentation/Database_Design.md` dosyasına bakın.
