using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Models;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class TaskAttachmentService : ITaskAttachmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly string _contentRoot;
        private readonly string _storageRoot;
        private readonly long _maxFileSize;

        public TaskAttachmentService(
            ApplicationDbContext context,
            IMapper mapper,
            IWebHostEnvironment environment,
            IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _contentRoot = Path.GetFullPath(environment.ContentRootPath);

            var configuredPath = configuration["FileUpload:StoragePath"] ?? "App_Data/uploads";
            _storageRoot = Path.GetFullPath(Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(_contentRoot, configuredPath));
            _maxFileSize = configuration.GetValue<long?>("FileUpload:MaxFileSizeBytes")
                ?? 10 * 1024 * 1024;
        }

        public async Task<List<TaskAttachmentDto>> GetAllAsync(Guid taskId, Guid userId)
        {
            await EnsureOwnedTaskAsync(taskId, userId);
            var attachments = await _context.TaskAttachments
                .AsNoTracking()
                .Where(item => item.TaskId == taskId)
                .OrderByDescending(item => item.UploadedAt)
                .ToListAsync();

            return _mapper.Map<List<TaskAttachmentDto>>(attachments);
        }

        public async Task<TaskAttachmentDto> UploadAsync(Guid taskId, Guid userId, IFormFile file)
        {
            await EnsureOwnedTaskAsync(taskId, userId);

            if (file.Length <= 0)
                throw new ArgumentException("Yüklenecek dosya boş olamaz.");
            if (file.Length > _maxFileSize)
                throw new ArgumentException($"Dosya boyutu {_maxFileSize / 1024 / 1024} MB sınırını aşıyor.");

            var originalFileName = Path.GetFileName(file.FileName);
            if (string.IsNullOrWhiteSpace(originalFileName) || originalFileName.Length > 255)
                throw new ArgumentException("Dosya adı geçersiz veya çok uzun.");

            var attachmentId = Guid.NewGuid();
            var extension = Path.GetExtension(originalFileName);
            var directory = Path.Combine(_storageRoot, userId.ToString("N"), taskId.ToString("N"));
            Directory.CreateDirectory(directory);
            var physicalPath = Path.Combine(directory, attachmentId.ToString("N") + extension);

            await using (var stream = new FileStream(
                physicalPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new TaskAttachment
            {
                Id = attachmentId,
                TaskId = taskId,
                FileName = originalFileName,
                FilePath = Path.GetRelativePath(_contentRoot, physicalPath),
                FileSize = file.Length,
                ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                    ? "application/octet-stream"
                    : file.ContentType[..Math.Min(file.ContentType.Length, 100)],
                UploadedAt = DateTime.UtcNow
            };

            try
            {
                _context.TaskAttachments.Add(attachment);
                await _context.SaveChangesAsync();
            }
            catch
            {
                File.Delete(physicalPath);
                throw;
            }

            return _mapper.Map<TaskAttachmentDto>(attachment);
        }

        public async Task<TaskAttachmentFile> GetFileAsync(
            Guid taskId,
            Guid attachmentId,
            Guid userId)
        {
            var attachment = await GetOwnedAttachmentAsync(taskId, attachmentId, userId);
            var physicalPath = ResolveStoredPath(attachment.FilePath);
            if (!File.Exists(physicalPath))
                throw new KeyNotFoundException("Dosya diskte bulunamadı.");

            return new TaskAttachmentFile
            {
                Metadata = _mapper.Map<TaskAttachmentDto>(attachment),
                PhysicalPath = physicalPath
            };
        }

        public async Task<bool> DeleteAsync(Guid taskId, Guid attachmentId, Guid userId)
        {
            await EnsureOwnedTaskAsync(taskId, userId);
            var attachment = await _context.TaskAttachments
                .FirstOrDefaultAsync(item => item.Id == attachmentId && item.TaskId == taskId);
            if (attachment == null)
                return false;

            var physicalPath = ResolveStoredPath(attachment.FilePath);
            _context.TaskAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            if (File.Exists(physicalPath))
                File.Delete(physicalPath);

            return true;
        }

        // Görev silindiğinde attachment satırları cascade ile gider; disk klasörü burada temizlenir.
        public void RemoveTaskFiles(Guid userId, Guid taskId)
        {
            var directory = Path.Combine(_storageRoot, userId.ToString("N"), taskId.ToString("N"));
            if (Directory.Exists(directory))
                Directory.Delete(directory, recursive: true);
        }

        private async Task<TaskAttachment> GetOwnedAttachmentAsync(
            Guid taskId,
            Guid attachmentId,
            Guid userId)
        {
            var attachment = await _context.TaskAttachments
                .AsNoTracking()
                .Include(item => item.Task)
                .FirstOrDefaultAsync(item => item.Id == attachmentId
                    && item.TaskId == taskId
                    && item.Task.UserId == userId);

            return attachment
                ?? throw new KeyNotFoundException("Dosya bulunamadı veya erişim yetkiniz yok.");
        }

        private async Task EnsureOwnedTaskAsync(Guid taskId, Guid userId)
        {
            var exists = await _context.Tasks.AsNoTracking()
                .AnyAsync(task => task.Id == taskId && task.UserId == userId);
            if (!exists)
                throw new KeyNotFoundException("Görev bulunamadı veya bu göreve erişim yetkiniz yok.");
        }

        private string ResolveStoredPath(string storedPath)
        {
            var physicalPath = Path.GetFullPath(Path.Combine(_contentRoot, storedPath));
            var rootWithSeparator = _storageRoot.TrimEnd(Path.DirectorySeparatorChar)
                + Path.DirectorySeparatorChar;
            if (!physicalPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Geçersiz dosya yolu.");

            return physicalPath;
        }
    }
}
