using System.ComponentModel.DataAnnotations;
using TaskManagement.API.Enums;

namespace TaskManagement.API.DTOs
{
    // Görev Yanıt DTO'su (TaskItemDto)
    public class TaskItemDto
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
        public CategoryDto? Category { get; set; }
    }

    // Görev Oluşturma DTO'su (CreateTaskDto)
    public class CreateTaskDto
    {
        [Required(ErrorMessage = "Görev başlığı zorunludur.")]
        [StringLength(100, ErrorMessage = "Başlık en fazla 100 karakter olabilir.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olabilir.")]
        public string? Description { get; set; }

        public Priority Priority { get; set; } = Priority.Normal;

        public DateTime? DueDate { get; set; }

        public Guid? CategoryId { get; set; }
    }

    // Görev Güncelleme DTO'su (UpdateTaskDto)
    public class UpdateTaskDto
    {
        [Required(ErrorMessage = "Görev başlığı zorunludur.")]
        [StringLength(100, ErrorMessage = "Başlık en fazla 100 karakter olabilir.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olabilir.")]
        public string? Description { get; set; }

        public Priority Priority { get; set; }

        public Status Status { get; set; }

        public DateTime? DueDate { get; set; }

        public Guid? CategoryId { get; set; }
    }

    // Görev Filtreleme ve Arama DTO'su (TaskFilterDto)
    public class TaskFilterDto
    {
        public string? SearchTerm { get; set; }
        public Status? Status { get; set; }
        public Priority? Priority { get; set; }
        public Guid? CategoryId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // Sayfalama (Pagination) Parametreleri
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}