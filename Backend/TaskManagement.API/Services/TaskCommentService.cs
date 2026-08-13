using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class TaskCommentService : ITaskCommentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public TaskCommentService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<TaskCommentDto>> GetAllAsync(Guid taskId, Guid userId)
        {
            await EnsureOwnedTaskAsync(taskId, userId);

            var comments = await _context.TaskComments
                .AsNoTracking()
                .Include(comment => comment.User)
                .Where(comment => comment.TaskId == taskId)
                .OrderBy(comment => comment.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<TaskCommentDto>>(comments);
        }

        public async Task<TaskCommentDto> CreateAsync(
            Guid taskId,
            Guid userId,
            CreateTaskCommentDto createDto)
        {
            await EnsureOwnedTaskAsync(taskId, userId);

            var comment = new TaskComment
            {
                TaskId = taskId,
                UserId = userId,
                Comment = createDto.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();

            var createdComment = await _context.TaskComments
                .AsNoTracking()
                .Include(item => item.User)
                .FirstAsync(item => item.Id == comment.Id);

            return _mapper.Map<TaskCommentDto>(createdComment);
        }

        public async Task<bool> DeleteAsync(Guid taskId, Guid commentId, Guid userId)
        {
            await EnsureOwnedTaskAsync(taskId, userId);

            var comment = await _context.TaskComments
                .FirstOrDefaultAsync(item => item.Id == commentId
                    && item.TaskId == taskId
                    && item.UserId == userId);

            if (comment == null)
                return false;

            _context.TaskComments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task EnsureOwnedTaskAsync(Guid taskId, Guid userId)
        {
            var exists = await _context.Tasks
                .AsNoTracking()
                .AnyAsync(task => task.Id == taskId && task.UserId == userId);

            if (!exists)
                throw new KeyNotFoundException("Görev bulunamadı veya bu göreve erişim yetkiniz yok.");
        }
    }
}
