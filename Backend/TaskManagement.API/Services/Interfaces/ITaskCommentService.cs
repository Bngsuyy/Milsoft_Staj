using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services.Interfaces
{
    public interface ITaskCommentService
    {
        Task<List<TaskCommentDto>> GetAllAsync(Guid taskId, Guid userId);
        Task<TaskCommentDto> CreateAsync(Guid taskId, Guid userId, CreateTaskCommentDto createDto);
        Task<bool> DeleteAsync(Guid taskId, Guid commentId, Guid userId);
    }
}
