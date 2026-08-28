using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CategoryService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<CategoryDto>> GetAllCategoriesAsync(Guid userId)
        {
            var categoriesWithCounts = await _context.Categories
                .AsNoTracking()
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Color = c.Color,
                    Icon = c.Icon,
                    ImageUrl = c.ImageUrl,
                    CreatedAt = c.CreatedAt,
                    TaskCount = _context.Tasks.Count(t => t.UserId == userId && t.CategoryId == c.Id)
                })
                .ToListAsync();

            return categoriesWithCounts;
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(Guid id, Guid userId)
        {
            var category = await _context.Categories
                .AsNoTracking()
                .Where(c => c.Id == id && c.UserId == userId)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Color = c.Color,
                    Icon = c.Icon,
                    ImageUrl = c.ImageUrl,
                    CreatedAt = c.CreatedAt,
                    TaskCount = _context.Tasks.Count(t => t.UserId == userId && t.CategoryId == c.Id)
                })
                .FirstOrDefaultAsync();

            if (category == null)
                throw new KeyNotFoundException("Kategori bulunamadı veya bu kategoriye erişim yetkiniz yok.");

            return category;
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createCategoryDto, Guid userId)
        {
            // İş Kuralı: Aynı isimde kategori var mı?
            var name = createCategoryDto.Name.Trim();
            var normalizedName = name.ToLowerInvariant();
            var exists = await _context.Categories
                .AnyAsync(c => c.UserId == userId && c.Name.ToLower() == normalizedName);

            if (exists)
                throw new InvalidOperationException("Bu isimde bir kategori zaten mevcut.");

            var category = _mapper.Map<Category>(createCategoryDto);
            category.Name = name;
            category.Description = createCategoryDto.Description?.Trim();
            category.Icon = string.IsNullOrWhiteSpace(createCategoryDto.Icon) ? null : createCategoryDto.Icon.Trim();
            category.ImageUrl = string.IsNullOrWhiteSpace(createCategoryDto.ImageUrl) ? null : createCategoryDto.ImageUrl.Trim();
            category.UserId = userId;
            category.CreatedAt = DateTime.UtcNow;

            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();

            // TaskCount alanının doğru dolması için kaydı yeniden okuyoruz.
            return await GetCategoryByIdAsync(category.Id, userId);
        }

        public async Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryDto updateCategoryDto, Guid userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (category == null)
                throw new KeyNotFoundException("Güncellenecek kategori bulunamadı.");

            // İsim değişiyorsa başka bir kategoriyle çakışıyor mu kontrol et
            var name = updateCategoryDto.Name.Trim();
            var normalizedName = name.ToLowerInvariant();
            if (category.Name.ToLower() != normalizedName)
            {
                var exists = await _context.Categories
                    .AnyAsync(c => c.Id != id && c.UserId == userId && c.Name.ToLower() == normalizedName);

                if (exists)
                    throw new InvalidOperationException("Bu isimde başka bir kategori zaten mevcut.");
            }

            _mapper.Map(updateCategoryDto, category);
            category.Name = name;
            category.Description = updateCategoryDto.Description?.Trim();
            category.Icon = string.IsNullOrWhiteSpace(updateCategoryDto.Icon) ? null : updateCategoryDto.Icon.Trim();
            category.ImageUrl = string.IsNullOrWhiteSpace(updateCategoryDto.ImageUrl) ? null : updateCategoryDto.ImageUrl.Trim();

            _context.Categories.Update(category);
            await _context.SaveChangesAsync();

            // TaskCount alanının doğru dolması için kaydı yeniden okuyoruz.
            return await GetCategoryByIdAsync(category.Id, userId);
        }

        public async Task<bool> DeleteCategoryAsync(Guid id, Guid userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (category == null)
                return false;

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
