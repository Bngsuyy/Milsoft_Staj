# Task Management Web

Kişisel Görev Yönetim Sistemi'nin React, TypeScript ve PrimeReact arayüzüdür.

## Gereksinimler

- Node.js 20 veya üzeri
- Çalışan TaskManagement API

## Yapılandırma

`.env.development` dosyasında API taban adresini tanımlayın:

```text
VITE_API_BASE_URL=http://localhost:5126/api
```

## Komutlar

```powershell
npm install
npm run dev
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

`npm run build`, TypeScript kontrolünü ve Vite production derlemesini birlikte çalıştırır.
Görev PDF/Excel dışa aktarma paketleri yalnızca özellik çağrıldığında dinamik olarak yüklenir.

Projenin tamamını çalıştırma, veritabanı kurulumu ve demo kullanıcı bilgileri için depo kökündeki
`README.md` dosyasına bakın.
