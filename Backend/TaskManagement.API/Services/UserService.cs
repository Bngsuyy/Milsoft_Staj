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
        private readonly string _profileImageRoot;
        private readonly long _maxProfileImageSize;

        // Dependency Injection ile DbContext ve AutoMapper servise enjekte ediliyor
        public UserService(
            ApplicationDbContext context,
            IMapper mapper,
            IWebHostEnvironment environment,
            IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            var webRoot = environment.WebRootPath
                ?? Path.Combine(environment.ContentRootPath, "wwwroot");
            _profileImageRoot = Path.GetFullPath(Path.Combine(webRoot, "profile-images"));
            _maxProfileImageSize = configuration.GetValue<long?>("ProfileImage:MaxFileSizeBytes")
                ?? 5 * 1024 * 1024;
        }

        public async Task<UserDto> GetByIdAsync(Guid id)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> GetByUsernameAsync(string username)
        {
            var normalizedUsername = username.Trim().ToLowerInvariant();
            var user = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == normalizedUsername);
            if (user == null)
                throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            return _mapper.Map<UserDto>(user);
        }

        public async Task<List<UserDto>> GetAllAsync()
        {
            var users = await _context.Users.AsNoTracking().ToListAsync();
            return _mapper.Map<List<UserDto>>(users);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            // İş Kuralı: Aynı e-posta veya kullanıcı adı var mı?
            var username = createUserDto.Username.Trim().ToLowerInvariant();
            var email = createUserDto.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Username == username))
                throw new InvalidOperationException("Bu kullanıcı adı zaten alınmış.");

            if (await _context.Users.AnyAsync(u => u.Email == email))
                throw new InvalidOperationException("Bu e-posta adresi zaten kullanımda.");

            var user = _mapper.Map<User>(createUserDto);
            user.Username = username;
            user.Email = email;
            user.FirstName = createUserDto.FirstName.Trim();
            user.LastName = createUserDto.LastName.Trim();
            
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

            if (!string.IsNullOrWhiteSpace(updateUserDto.Email))
            {
                var email = updateUserDto.Email.Trim().ToLowerInvariant();
                var emailInUse = await _context.Users
                    .AnyAsync(u => u.Id != id && u.Email == email);
                if (emailInUse)
                    throw new InvalidOperationException("Bu e-posta adresi zaten kullanımda.");

                updateUserDto.Email = email;
            }

            _mapper.Map(updateUserDto, user);
            user.FirstName = updateUserDto.FirstName.Trim();
            user.LastName = updateUserDto.LastName.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UploadProfileImageAsync(Guid id, IFormFile file)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            if (file.Length <= 0)
                throw new ArgumentException("Yüklenecek profil fotoğrafı boş olamaz.");
            if (file.Length > _maxProfileImageSize)
                throw new ArgumentException(
                    $"Profil fotoğrafı {_maxProfileImageSize / 1024 / 1024} MB sınırını aşıyor.");

            var extension = await GetValidatedImageExtensionAsync(file);
            Directory.CreateDirectory(_profileImageRoot);

            var newFileName = $"{Guid.NewGuid():N}{extension}";
            var newPhysicalPath = Path.Combine(_profileImageRoot, newFileName);
            var previousFileName = user.ProfileImagePath;

            await using (var stream = new FileStream(
                newPhysicalPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true))
            {
                await file.CopyToAsync(stream);
            }

            user.ProfileImagePath = newFileName;
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                TryDeleteProfileImage(newFileName);
                throw;
            }

            if (!string.IsNullOrWhiteSpace(previousFileName))
                TryDeleteProfileImage(previousFileName);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> DeleteProfileImageAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            var previousFileName = user.ProfileImagePath;
            if (string.IsNullOrWhiteSpace(previousFileName))
                return _mapper.Map<UserDto>(user);

            user.ProfileImagePath = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            TryDeleteProfileImage(previousFileName);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            var profileImagePath = user.ProfileImagePath;
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(profileImagePath))
                TryDeleteProfileImage(profileImagePath);

            return true;
        }

        private static async Task<string> GetValidatedImageExtensionAsync(IFormFile file)
        {
            var contentType = file.ContentType.Trim().ToLowerInvariant();
            if (contentType is not ("image/jpeg" or "image/png" or "image/webp"))
                throw new ArgumentException("Yalnızca JPG, PNG veya WebP görselleri yüklenebilir.");

            var header = new byte[12];
            await using var input = file.OpenReadStream();
            var bytesRead = await input.ReadAsync(header.AsMemory(0, header.Length));

            var hasValidSignature = contentType switch
            {
                "image/jpeg" => bytesRead >= 3
                    && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
                "image/png" => bytesRead >= 8
                    && header[0] == 0x89 && header[1] == 0x50
                    && header[2] == 0x4E && header[3] == 0x47
                    && header[4] == 0x0D && header[5] == 0x0A
                    && header[6] == 0x1A && header[7] == 0x0A,
                "image/webp" => bytesRead >= 12
                    && header[0] == 0x52 && header[1] == 0x49
                    && header[2] == 0x46 && header[3] == 0x46
                    && header[8] == 0x57 && header[9] == 0x45
                    && header[10] == 0x42 && header[11] == 0x50,
                _ => false
            };

            if (!hasValidSignature)
                throw new ArgumentException("Dosya geçerli bir görsel içermiyor.");

            return contentType switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => throw new ArgumentException("Görsel türü desteklenmiyor.")
            };
        }

        private void TryDeleteProfileImage(string fileName)
        {
            var safeFileName = Path.GetFileName(fileName);
            if (!string.Equals(safeFileName, fileName, StringComparison.Ordinal))
                return;

            var physicalPath = Path.GetFullPath(Path.Combine(_profileImageRoot, safeFileName));
            var rootWithSeparator = _profileImageRoot.TrimEnd(Path.DirectorySeparatorChar)
                + Path.DirectorySeparatorChar;
            if (!physicalPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
                return;

            try
            {
                if (File.Exists(physicalPath))
                    File.Delete(physicalPath);
            }
            catch (IOException)
            {
                // Veritabanı güncellemesi başarılıysa geçici dosya kilidi isteği bozmaz.
            }
            catch (UnauthorizedAccessException)
            {
                // Dosya sistemi izni sorunu profil güncellemesini geri almamalı.
            }
        }
    }
}
