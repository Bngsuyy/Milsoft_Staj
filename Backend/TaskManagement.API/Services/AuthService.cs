using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IJwtService _jwtService;

        public AuthService(ApplicationDbContext context, IMapper mapper, IJwtService jwtService)
        {
            _context = context;
            _mapper = mapper;
            _jwtService = jwtService;
        }

        public async Task<UserDto> RegisterAsync(CreateUserDto registerDto)
        {
            var username = registerDto.Username.Trim().ToLowerInvariant();
            var email = registerDto.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Username == username))
            {
                throw new InvalidOperationException("Bu kullanıcı adı zaten alınmış.");
            }

            if (await _context.Users.AnyAsync(u => u.Email == email))
            {
                throw new InvalidOperationException("Bu e-posta adresi zaten kullanımda.");
            }

            var user = _mapper.Map<User>(registerDto);
            user.Username = username;
            user.Email = email;
            user.FirstName = registerDto.FirstName.Trim();
            user.LastName = registerDto.LastName.Trim();

            // Şifre BCrypt ile hash'leniyor
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            user.IsActive = true;

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<string> LoginAsync(LoginDto loginDto)
        {
            var username = loginDto.Username.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            
            // Kullanıcı yoksa veya şifre BCrypt doğrulamasından geçmezse
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new InvalidOperationException("Kullanıcı adı veya şifre hatalı.");
            }

            if (!user.IsActive)
            {
                throw new InvalidOperationException("Hesabınız pasif durumdadır.");
            }

            // Doğrulama başarılıysa JWT Token üret
            return _jwtService.GenerateToken(user);
        }
    }
}
