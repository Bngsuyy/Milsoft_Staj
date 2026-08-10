namespace TaskManagement.API.Entities
{
    public class Category
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = "#007bff";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Key
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        // Navigation Properties
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}