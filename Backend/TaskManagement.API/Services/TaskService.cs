using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Enums;
using TaskManagement.API.Models;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ITaskAttachmentService _attachmentService;

        public TaskService(
            ApplicationDbContext context,
            IMapper mapper,
            ITaskAttachmentService attachmentService)
        {
            _context = context;
            _mapper = mapper;
            _attachmentService = attachmentService;
        }

        public async Task<PagedResult<TaskItemDto>> GetAllTasksAsync(Guid userId, TaskFilterDto filterDto)
        {
            // 1. Temel Sorgu
            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
                .AsQueryable();

            // 2. Dinamik Filtreleme
            if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
            {
                var search = filterDto.SearchTerm.Trim().ToLowerInvariant();
                query = query.Where(t => t.Title.ToLower().Contains(search) || 
                                         (t.Description != null && t.Description.ToLower().Contains(search)));
            }

            if (filterDto.Status.HasValue)
                query = query.Where(t => t.Status == filterDto.Status.Value);

            if (filterDto.Priority.HasValue)
                query = query.Where(t => t.Priority == filterDto.Priority.Value);

            if (filterDto.CategoryId.HasValue)
                query = query.Where(t => t.CategoryId == filterDto.CategoryId.Value);

            if (filterDto.StartDate.HasValue)
            {
                var startDate = NormalizeUtc(filterDto.StartDate.Value);
                query = query.Where(t => t.CreatedAt >= startDate);
            }

            if (filterDto.EndDate.HasValue)
            {
                var endDate = NormalizeUtc(filterDto.EndDate.Value);
                query = query.Where(t => t.CreatedAt <= endDate);
            }

            // 3. Toplam Kayıt Sayısını Hesapla (Sayfalamadan Önce)
            var totalCount = await query.CountAsync();

            // 4. Sayfalama Değerlerini Doğrula
            var pageNumber = filterDto.PageNumber < 1 ? 1 : filterDto.PageNumber;
            var pageSize = filterDto.PageSize < 1 ? 10 : (filterDto.PageSize > 50 ? 50 : filterDto.PageSize);

            // 5. Skip() ve Take() Uygulama
            var tasks = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var taskDtos = _mapper.Map<List<TaskItemDto>>(tasks);

            // 6. PagedResult Olarak Paketle
            return new PagedResult<TaskItemDto>
            {
                Items = taskDtos,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<TaskItemDto> GetTaskByIdAsync(Guid id, Guid userId)
        {
            var task = await _context.Tasks
                .AsNoTracking()
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
            task.Title = createTaskDto.Title.Trim();
            task.Description = createTaskDto.Description?.Trim();
            task.DueDate = EnsureUtc(createTaskDto.DueDate);
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
            task.Title = updateTaskDto.Title.Trim();
            task.Description = updateTaskDto.Description?.Trim();
            task.DueDate = EnsureUtc(updateTaskDto.DueDate);
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

            // Ek kayitlari cascade ile silinir; diskteki dosyalar burada temizlenir.
            _attachmentService.RemoveTaskFiles(userId, task.Id);
            return true;
        }

        public async Task<PagedResult<TaskItemDto>> GetOverdueTasksAsync(
            Guid userId,
            int pageNumber,
            int pageSize)
        {
            pageNumber = pageNumber < 1 ? 1 : pageNumber;
            pageSize = pageSize < 1 ? 10 : Math.Min(pageSize, 50);
            var now = DateTime.UtcNow;

            var query = _context.Tasks
                .AsNoTracking()
                .Include(task => task.Category)
                .Where(task => task.UserId == userId
                    && task.DueDate.HasValue
                    && task.DueDate.Value < now
                    && task.Status != Status.Completed
                    && task.Status != Status.Cancelled);

            var totalCount = await query.CountAsync();
            var tasks = await query
                .OrderBy(task => task.DueDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<TaskItemDto>
            {
                Items = _mapper.Map<List<TaskItemDto>>(tasks),
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<TaskStatisticsDto> GetStatisticsAsync(Guid userId)
        {
            var now = DateTime.UtcNow;
            var query = _context.Tasks.AsNoTracking().Where(task => task.UserId == userId);

            return new TaskStatisticsDto
            {
                Total = await query.CountAsync(),
                Pending = await query.CountAsync(task => task.Status == Status.Pending),
                InProgress = await query.CountAsync(task => task.Status == Status.InProgress),
                Completed = await query.CountAsync(task => task.Status == Status.Completed),
                Cancelled = await query.CountAsync(task => task.Status == Status.Cancelled),
                Overdue = await query.CountAsync(task => task.DueDate.HasValue
                    && task.DueDate.Value < now
                    && task.Status != Status.Completed
                    && task.Status != Status.Cancelled)
            };
        }

        public async Task<int> BulkUpdateStatusAsync(Guid userId, BulkTaskStatusDto bulkStatusDto)
        {
            var taskIds = bulkStatusDto.TaskIds.Distinct().ToList();
            var tasks = await _context.Tasks
                .Where(task => task.UserId == userId && taskIds.Contains(task.Id))
                .ToListAsync();

            if (tasks.Count == 0)
                throw new KeyNotFoundException("Seçilen görevler bulunamadı veya erişim yetkiniz yok.");

            var now = DateTime.UtcNow;
            foreach (var task in tasks)
            {
                // Tekil güncellemeyle aynı tamamlanma tarihi kuralı uygulanır.
                if (bulkStatusDto.Status == Status.Completed && task.Status != Status.Completed)
                    task.CompletedAt = now;
                else if (bulkStatusDto.Status != Status.Completed)
                    task.CompletedAt = null;

                task.Status = bulkStatusDto.Status;
                task.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();
            return tasks.Count;
        }

        public async Task<int> BulkDeleteAsync(Guid userId, BulkTaskDeleteDto bulkDeleteDto)
        {
            var taskIds = bulkDeleteDto.TaskIds.Distinct().ToList();
            var tasks = await _context.Tasks
                .Where(task => task.UserId == userId && taskIds.Contains(task.Id))
                .ToListAsync();

            if (tasks.Count == 0)
                throw new KeyNotFoundException("Silinecek görev bulunamadı veya erişim yetkiniz yok.");

            _context.Tasks.RemoveRange(tasks);
            await _context.SaveChangesAsync();

            foreach (var task in tasks)
                _attachmentService.RemoveTaskFiles(userId, task.Id);

            return tasks.Count;
        }

        public async Task<List<TaskItemDto>> BulkCreateTasksAsync(Guid userId, BulkTaskCreateDto bulkCreateDto)
        {
            if (bulkCreateDto.Tasks == null || bulkCreateDto.Tasks.Count == 0)
                return new List<TaskItemDto>();

            var validCategoryIds = await _context.Categories
                .Where(c => c.UserId == userId)
                .Select(c => c.Id)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var createdEntities = new List<TaskItem>();

            foreach (var dto in bulkCreateDto.Tasks)
            {
                var title = dto.Title?.Trim();
                if (string.IsNullOrWhiteSpace(title))
                    continue;

                Guid? categoryId = null;
                if (dto.CategoryId.HasValue && validCategoryIds.Contains(dto.CategoryId.Value))
                {
                    categoryId = dto.CategoryId.Value;
                }

                var task = new TaskItem
                {
                    Id = Guid.NewGuid(),
                    Title = title.Length > 200 ? title.Substring(0, 200) : title,
                    Description = dto.Description?.Trim(),
                    Priority = dto.Priority,
                    Status = Status.Pending,
                    DueDate = EnsureUtc(dto.DueDate),
                    UserId = userId,
                    CategoryId = categoryId,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                createdEntities.Add(task);
            }

            if (createdEntities.Count > 0)
            {
                await _context.Tasks.AddRangeAsync(createdEntities);
                await _context.SaveChangesAsync();
            }

            var createdIds = createdEntities.Select(t => t.Id).ToList();
            var result = await _context.Tasks
                .AsNoTracking()
                .Include(t => t.Category)
                .Where(t => t.UserId == userId && createdIds.Contains(t.Id))
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return _mapper.Map<List<TaskItemDto>>(result);
        }

        private static DateTime? EnsureUtc(DateTime? value)
        {
            return value.HasValue ? NormalizeUtc(value.Value) : null;
        }

        private static DateTime NormalizeUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
            };
        }
    }
}
