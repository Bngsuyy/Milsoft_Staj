using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Enums;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public TaskService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<TaskItemDto>> GetAllTasksAsync(Guid userId, TaskFilterDto filterDto)
        {
            // 1. Temel Sorgu: Sadece ilgili kullanıcıya ait görevler ve kategorileri
            var query = _context.Tasks
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .AsQueryable();

            // 2. Dinamik Filtreleme Kuralları
            if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
            {
                var search = filterDto.SearchTerm.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(search) || 
                                         (t.Description != null && t.Description.ToLower().Contains(search)));
            }

            if (filterDto.Status.HasValue)
            {
                query = query.Where(t => t.Status == filterDto.Status.Value);
            }

            if (filterDto.Priority.HasValue)
            {
                query = query.Where(t => t.Priority == filterDto.Priority.Value);
            }

            if (filterDto.CategoryId.HasValue)
            {
                query = query.Where(t => t.CategoryId == filterDto.CategoryId.Value);
            }

            if (filterDto.StartDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt >= filterDto.StartDate.Value);
            }

            if (filterDto.EndDate.HasValue)
            {
                query = query.Where(t => t.CreatedAt <= filterDto.EndDate.Value);
            }

            // 3. Sayfalama (Pagination) Mantığı
            var pageNumber = filterDto.PageNumber < 1 ? 1 : filterDto.PageNumber;
            var pageSize = filterDto.PageSize < 1 ? 10 : (filterDto.PageSize > 50 ? 50 : filterDto.PageSize);

            var tasks = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return _mapper.Map<List<TaskItemDto>>(tasks);
        }

        public async Task<TaskItemDto> GetTaskByIdAsync(Guid id, Guid userId)
        {
            var task = await _context.Tasks
                .Include(t => t.Category)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (task == null)
                throw new KeyNotFoundException("Görev bulunamadı veya bu göreve erişim yetkiniz yok.");

            return _mapper.Map<TaskItemDto>(task);
        }

        public async Task<TaskItemDto> CreateTaskAsync(CreateTaskDto createTaskDto, Guid userId)
        {
            if (createTaskDto.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == createTaskDto.CategoryId.Value && c.UserId == userId);
                if (!categoryExists)
                    throw new InvalidOperationException("Geçersiz kategori seçimi.");
            }

            var task = _mapper.Map<TaskItem>(createTaskDto);
            task.UserId = userId;
            task.Status = Status.Pending;
            task.CreatedAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.Tasks.AddAsync(task);
            await _context.SaveChangesAsync();

            return await GetTaskByIdAsync(task.Id, userId);
        }

        public async Task<TaskItemDto> UpdateTaskAsync(Guid id, UpdateTaskDto updateTaskDto, Guid userId)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null)
                throw new KeyNotFoundException("Güncellenecek görev bulunamadı.");

            if (updateTaskDto.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == updateTaskDto.CategoryId.Value && c.UserId == userId);
                if (!categoryExists)
                    throw new InvalidOperationException("Geçersiz kategori seçimi.");
            }

            if (updateTaskDto.Status == Status.Completed && task.Status != Status.Completed)
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else if (updateTaskDto.Status != Status.Completed)
            {
                task.CompletedAt = null;
            }

            _mapper.Map(updateTaskDto, task);
            task.UpdatedAt = DateTime.UtcNow;

            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();

            return await GetTaskByIdAsync(task.Id, userId);
        }

        public async Task<bool> DeleteTaskAsync(Guid id, Guid userId)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null)
                return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}