using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services.Interfaces
{
    public interface ITaskService
    {
        Task<List<TaskItemDto>> GetAllTasksAsync(Guid userId, TaskFilterDto filterDto);
        Task<TaskItemDto> GetTaskByIdAsync(Guid id, Guid userId);
        Task<TaskItemDto> CreateTaskAsync(CreateTaskDto createTaskDto, Guid userId);
        Task<TaskItemDto> UpdateTaskAsync(Guid id, UpdateTaskDto updateTaskDto, Guid userId);
        Task<bool> DeleteTaskAsync(Guid id, Guid userId);
    }
}