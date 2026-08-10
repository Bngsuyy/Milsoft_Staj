using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        // Dependency Injection ile DbContext ve AutoMapper servise enjekte ediliyor
        public UserService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<UserDto> GetByIdAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> GetByUsernameAsync(string username)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            return _mapper.Map<UserDto>(user);
        }

        public async Task<List<UserDto>> GetAllAsync()
        {
            var users = await _context.Users.ToListAsync();
            return _mapper.Map<List<UserDto>>(users);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            // İş Kuralı: Aynı e-posta veya kullanıcı adı var mı?
            if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username))
                throw new InvalidOperationException("Bu kullanıcı adı zaten alınmış.");

            if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
                throw new InvalidOperationException("Bu e-posta adresi zaten kullanımda.");

            var user = _mapper.Map<User>(createUserDto);
            
            // Güvenlik Kuralı: Şifre asla düz metin saklanmaz, BCrypt ile hash'lenir
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            user.IsActive = true;

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                throw new KeyNotFoundException("Güncellenecek kullanıcı bulunamadı.");

            _mapper.Map(updateUserDto, user);
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}