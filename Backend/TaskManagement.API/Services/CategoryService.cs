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
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return _mapper.Map<List<CategoryDto>>(categories);
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(Guid id, Guid userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (category == null)
                throw new KeyNotFoundException("Kategori bulunamadı veya bu kategoriye erişim yetkiniz yok.");

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createCategoryDto, Guid userId)
        {
            // İş Kuralı: Aynı isimde kategori var mı?
            var exists = await _context.Categories
                .AnyAsync(c => c.UserId == userId && c.Name.ToLower() == createCategoryDto.Name.ToLower());

            if (exists)
                throw new InvalidOperationException("Bu isimde bir kategori zaten mevcut.");

            var category = _mapper.Map<Category>(createCategoryDto);
            category.UserId = userId;
            category.CreatedAt = DateTime.UtcNow;

            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryDto updateCategoryDto, Guid userId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (category == null)
                throw new KeyNotFoundException("Güncellenecek kategori bulunamadı.");

            // İsim değişiyorsa başka bir kategoriyle çakışıyor mu kontrol et
            if (category.Name.ToLower() != updateCategoryDto.Name.ToLower())
            {
                var exists = await _context.Categories
                    .AnyAsync(c => c.UserId == userId && c.Name.ToLower() == updateCategoryDto.Name.ToLower());

                if (exists)
                    throw new InvalidOperationException("Bu isimde başka bir kategori zaten mevcut.");
            }

            _mapper.Map(updateCategoryDto, category);

            _context.Categories.Update(category);
            await _context.SaveChangesAsync();

            return _mapper.Map<CategoryDto>(category);
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