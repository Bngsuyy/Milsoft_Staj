using System.ComponentModel.DataAnnotations;

namespace TaskManagement.API.DTOs
{
    // Kategori Yanıt DTO'su (CategoryDto)
    public class CategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Color { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // Kategori Oluşturma DTO'su (CreateCategoryDto)
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Kategori adı zorunludur.")]
        [StringLength(100, ErrorMessage = "Kategori adı en fazla 100 karakter olabilir.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir.")]
        public string? Description { get; set; }

        [RegularExpression("^#(?:[0-9a-fA-F]{3}){1,2}$", ErrorMessage = "Geçerli bir Hex renk kodu giriniz (ör: #FF5733).")]
        public string Color { get; set; } = "#007bff";
    }

    // Kategori Güncelleme DTO'su (UpdateCategoryDto)
    public class UpdateCategoryDto
    {
        [Required(ErrorMessage = "Kategori adı zorunludur.")]
        [StringLength(100, ErrorMessage = "Kategori adı en fazla 100 karakter olabilir.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir.")]
        public string? Description { get; set; }

        [RegularExpression("^#(?:[0-9a-fA-F]{3}){1,2}$", ErrorMessage = "Geçerli bir Hex renk kodu giriniz.")]
        public string Color { get; set; } = "#007bff";
    }
}
