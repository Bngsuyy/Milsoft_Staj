using TaskManagement.API.DTOs;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services.Interfaces
{
    public interface ITaskService
    {
        Task<PagedResult<TaskItemDto>> GetAllTasksAsync(Guid userId, TaskFilterDto filterDto);
        Task<TaskItemDto> GetTaskByIdAsync(Guid id, Guid userId);
        Task<TaskItemDto> CreateTaskAsync(CreateTaskDto createTaskDto, Guid userId);
        Task<TaskItemDto> UpdateTaskAsync(Guid id, UpdateTaskDto updateTaskDto, Guid userId);
        Task<bool> DeleteTaskAsync(Guid id, Guid userId);
        Task<PagedResult<TaskItemDto>> GetOverdueTasksAsync(Guid userId, int pageNumber, int pageSize);
        Task<TaskStatisticsDto> GetStatisticsAsync(Guid userId);
        Task<int> BulkUpdateStatusAsync(Guid userId, BulkTaskStatusDto bulkStatusDto);
        Task<int> BulkDeleteAsync(Guid userId, BulkTaskDeleteDto bulkDeleteDto);
    }
}
