namespace TaskManagement.API.Entities
{
    public class TaskComment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        public Guid TaskId { get; set; }
        public TaskItem Task { get; set; } = null!;

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}