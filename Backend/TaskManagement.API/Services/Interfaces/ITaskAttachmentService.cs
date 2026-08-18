using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services.Interfaces
{
    public interface ITaskAttachmentService
    {
        Task<List<TaskAttachmentDto>> GetAllAsync(Guid taskId, Guid userId);
        Task<TaskAttachmentDto> UploadAsync(Guid taskId, Guid userId, IFormFile file);
        Task<TaskAttachmentFile> GetFileAsync(Guid taskId, Guid attachmentId, Guid userId);
        Task<bool> DeleteAsync(Guid taskId, Guid attachmentId, Guid userId);

        /// <summary>Görev silindiğinde diskte kalan dosya klasörünü temizler.</summary>
        void RemoveTaskFiles(Guid userId, Guid taskId);
    }
}
