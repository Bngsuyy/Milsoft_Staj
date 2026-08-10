using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<List<CategoryDto>> GetAllCategoriesAsync(Guid userId);
        Task<CategoryDto> GetCategoryByIdAsync(Guid id, Guid userId);
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createCategoryDto, Guid userId);
        Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryDto updateCategoryDto, Guid userId);
        Task<bool> DeleteCategoryAsync(Guid id, Guid userId);
    }
}