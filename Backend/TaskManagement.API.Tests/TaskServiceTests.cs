using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Enums;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using TaskManagement.API.Services.Interfaces;
using Xunit;

namespace TaskManagement.API.Tests
{
    public class TaskServiceTests
    {
        private readonly IMapper _mapper;

        public TaskServiceTests()
        {
            _mapper = new MapperConfiguration(configuration =>
                configuration.AddProfile<MappingProfile>()).CreateMapper();
        }

        [Fact]
        public async Task GetAllTasks_ReturnsOnlyAuthenticatedUsersTasks()
        {
            await using var context = CreateContext();
            var owner = CreateUser("owner");
            var other = CreateUser("other");
            context.Users.AddRange(owner, other);
            context.Tasks.AddRange(
                CreateTask("Benim görevim", owner.Id),
                CreateTask("Başkasının görevi", other.Id));
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.GetAllTasksAsync(owner.Id, new TaskFilterDto());

            Assert.Single(result.Items);
            Assert.Equal("Benim görevim", result.Items[0].Title);
        }

        [Fact]
        public async Task CreateTask_RejectsAnotherUsersCategory()
        {
            await using var context = CreateContext();
            var owner = CreateUser("owner");
            var other = CreateUser("other");
            var category = new Category { Name = "Özel", UserId = other.Id };
            context.Users.AddRange(owner, other);
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var request = new CreateTaskDto { Title = "Görev", CategoryId = category.Id };

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => service.CreateTaskAsync(request, owner.Id));
        }

        [Fact]
        public async Task UpdateTask_SetsCompletedAtWhenCompleted()
        {
            await using var context = CreateContext();
            var owner = CreateUser("owner");
            var task = CreateTask("Görev", owner.Id);
            context.Users.Add(owner);
            context.Tasks.Add(task);
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var result = await service.UpdateTaskAsync(task.Id, new UpdateTaskDto
            {
                Title = task.Title,
                Priority = Priority.Normal,
                Status = Status.Completed
            }, owner.Id);

            Assert.Equal(Status.Completed, result.Status);
            Assert.NotNull(result.CompletedAt);
            Assert.Equal(DateTimeKind.Utc, result.CompletedAt!.Value.Kind);
        }

        [Fact]
        public async Task Statistics_CountsOverdueActiveTasks()
        {
            await using var context = CreateContext();
            var owner = CreateUser("owner");
            context.Users.Add(owner);
            context.Tasks.AddRange(
                CreateTask("Gecikmiş", owner.Id, DateTime.UtcNow.AddDays(-1)),
                CreateTask("Gelecek", owner.Id, DateTime.UtcNow.AddDays(1)),
                CreateTask("Tamamlandı", owner.Id, DateTime.UtcNow.AddDays(-2), Status.Completed));
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var statistics = await service.GetStatisticsAsync(owner.Id);

            Assert.Equal(3, statistics.Total);
            Assert.Equal(1, statistics.Overdue);
            Assert.Equal(1, statistics.Completed);
        }

        [Fact]
        public async Task BulkUpdateStatus_OnlyTouchesAuthenticatedUsersTasks()
        {
            await using var context = CreateContext();
            var owner = CreateUser("owner");
            var other = CreateUser("other");
            var ownedTask = CreateTask("Benim görevim", owner.Id);
            var foreignTask = CreateTask("Başkasının görevi", other.Id);
            context.Users.AddRange(owner, other);
            context.Tasks.AddRange(ownedTask, foreignTask);
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var affectedCount = await service.BulkUpdateStatusAsync(owner.Id, new BulkTaskStatusDto
            {
                TaskIds = new List<Guid> { ownedTask.Id, foreignTask.Id },
                Status = Status.Completed
            });

            Assert.Equal(1, affectedCount);
            Assert.Equal(Status.Completed, (await context.Tasks.FindAsync(ownedTask.Id))!.Status);
            Assert.NotNull((await context.Tasks.FindAsync(ownedTask.Id))!.CompletedAt);
            Assert.Equal(Status.Pending, (await context.Tasks.FindAsync(foreignTask.Id))!.Status);
        }

        [Fact]
        public async Task BulkDelete_RemovesOnlySelectedOwnedTasks()
        {
            await using var context = CreateContext();
            var owner = CreateUser("owner");
            var removedTask = CreateTask("Silinecek", owner.Id);
            var keptTask = CreateTask("Kalacak", owner.Id);
            context.Users.Add(owner);
            context.Tasks.AddRange(removedTask, keptTask);
            await context.SaveChangesAsync();

            var service = CreateService(context);
            var affectedCount = await service.BulkDeleteAsync(owner.Id, new BulkTaskDeleteDto
            {
                TaskIds = new List<Guid> { removedTask.Id }
            });

            Assert.Equal(1, affectedCount);
            Assert.Null(await context.Tasks.FindAsync(removedTask.Id));
            Assert.NotNull(await context.Tasks.FindAsync(keptTask.Id));
        }

        private static TaskService CreateService(ApplicationDbContext context)
        {
            return new TaskService(
                context,
                new MapperConfiguration(configuration =>
                    configuration.AddProfile<MappingProfile>()).CreateMapper(),
                new NoopAttachmentService());
        }

        private static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private static User CreateUser(string username)
        {
            return new User
            {
                Username = username,
                Email = $"{username}@example.com",
                PasswordHash = "hash",
                FirstName = username,
                LastName = "User"
            };
        }

        private static TaskItem CreateTask(
            string title,
            Guid userId,
            DateTime? dueDate = null,
            Status status = Status.Pending)
        {
            return new TaskItem
            {
                Title = title,
                UserId = userId,
                Priority = Priority.Normal,
                Status = status,
                DueDate = dueDate,
                CompletedAt = status == Status.Completed ? DateTime.UtcNow : null
            };
        }

        // Birim testlerinde diske erisilmemesi icin bos implementasyon kullanilir.
        private sealed class NoopAttachmentService : ITaskAttachmentService
        {
            public Task<List<TaskAttachmentDto>> GetAllAsync(Guid taskId, Guid userId) =>
                Task.FromResult(new List<TaskAttachmentDto>());

            public Task<TaskAttachmentDto> UploadAsync(Guid taskId, Guid userId, IFormFile file) =>
                throw new NotSupportedException();

            public Task<TaskAttachmentFile> GetFileAsync(Guid taskId, Guid attachmentId, Guid userId) =>
                throw new NotSupportedException();

            public Task<bool> DeleteAsync(Guid taskId, Guid attachmentId, Guid userId) =>
                Task.FromResult(false);

            public void RemoveTaskFiles(Guid userId, Guid taskId)
            {
            }
        }
    }
}
