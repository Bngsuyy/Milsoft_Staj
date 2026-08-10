using TaskManagement.API.Enums;

namespace TaskManagement.API.DTOs
{
    public class TaskCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Priority Priority { get; set; } = Priority.Normal;
        public DateTime? DueDate { get; set; }
        public Guid? CategoryId { get; set; }
    }

    public class TaskResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Priority Priority { get; set; }
        public Status Status { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid UserId { get; set; }
        public CategoryResponseDto? Category { get; set; }
    }
}