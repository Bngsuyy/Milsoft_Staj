# API Endpoints

Geliştirme taban adresi: `http://localhost:5126/api`

`Auth/register` ve `Auth/login` dışındaki uçlar JWT ister. İstek başlığı:

```text
Authorization: Bearer <token>
```

Enum değerleri JSON'da adlarıyla kullanılır:

- Priority: `Low`, `Normal`, `High`, `Urgent`, `Critical`
- Status: `Pending`, `InProgress`, `Completed`, `Cancelled`

## Authentication ve profil

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| POST | `/Auth/register` | Kullanıcı oluşturur. |
| POST | `/Auth/login` | JWT döndürür. |
| GET | `/Auth/profile` | Giriş yapan kullanıcının profilini döndürür. |
| PUT | `/Auth/profile` | Ad, soyad ve isteğe bağlı e-posta alanlarını günceller. |

Kayıt gövdesi:

```json
{
  "username": "gokberk",
  "email": "gokberk@example.com",
  "password": "Secure123!",
  "firstName": "Gökberk",
  "lastName": "Kullanıcı"
}
```

Giriş gövdesi:

```json
{
  "username": "gokberk",
  "password": "Secure123!"
}
```

## Görevler

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| GET | `/Tasks` | Filtrelenmiş ve sayfalanmış görev listesini döndürür. |
| GET | `/Tasks/{id}` | Tek görevi döndürür. |
| POST | `/Tasks` | Görev oluşturur. |
| PUT | `/Tasks/{id}` | Görevi günceller. |
| DELETE | `/Tasks/{id}` | Görevi ve bağlı yorum/dosya kayıtlarını siler. |
| GET | `/Tasks/overdue` | Tamamlanmamış ve vadesi geçmiş görevleri döndürür. |
| GET | `/Tasks/statistics` | Durum ve gecikme sayılarını döndürür. |

Liste sorgu parametreleri: `searchTerm`, `status`, `priority`, `categoryId`, `startDate`, `endDate`, `pageNumber`, `pageSize`. `pageSize` en fazla 50'dir.

Görev oluşturma örneği:

```json
{
  "title": "Haftalık raporu hazırla",
  "description": "Cuma gününe kadar tamamla",
  "priority": "High",
  "dueDate": "2026-08-14T15:00:00Z",
  "categoryId": null
}
```

## Kategoriler

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| GET | `/Categories` | Kullanıcının kategorilerini döndürür. |
| GET | `/Categories/{id}` | Tek kategoriyi döndürür. |
| POST | `/Categories` | Kategori oluşturur. |
| PUT | `/Categories/{id}` | Kategoriyi günceller. |
| DELETE | `/Categories/{id}` | Kategoriyi siler; bağlı görevlerin `CategoryId` alanı null olur. |

## Yorumlar

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| GET | `/Tasks/{taskId}/comments` | Görev yorumlarını döndürür. |
| POST | `/Tasks/{taskId}/comments` | `{ "comment": "..." }` gövdesiyle yorum ekler. |
| DELETE | `/Tasks/{taskId}/comments/{commentId}` | Yorumu siler. |

## Dosyalar

| Method | Endpoint | Açıklama |
| --- | --- | --- |
| GET | `/Tasks/{taskId}/attachments` | Dosya metadatasını döndürür. |
| POST | `/Tasks/{taskId}/attachments` | `multipart/form-data` içindeki `file` alanını yükler. |
| GET | `/Tasks/{taskId}/attachments/{attachmentId}/download` | Dosyayı indirir. |
| DELETE | `/Tasks/{taskId}/attachments/{attachmentId}` | Dosya kaydını ve fiziksel dosyayı siler. |

Dosya sınırı varsayılan olarak 10 MB'dir ve `FileUpload:MaxFileSizeBytes` ile değiştirilebilir.

## Hata yanıtı

```json
{
  "statusCode": 404,
  "message": "Görev bulunamadı veya bu göreve erişim yetkiniz yok.",
  "detailed": null,
  "traceId": "..."
}
```
