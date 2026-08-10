using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<UserDto> RegisterAsync(CreateUserDto registerDto);
        Task<string> LoginAsync(LoginDto loginDto);
    }
}