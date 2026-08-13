using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.DTOs
{
    public class TaskCommentDto
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateTaskCommentDto
    {
        [Required(ErrorMessage = "Yorum metni zorunludur.")]
        [StringLength(2000, MinimumLength = 1, ErrorMessage = "Yorum 1 ile 2000 karakter arasında olmalıdır.")]
        public string Comment { get; set; } = string.Empty;
    }
}
