using TaskManagement.API.DTOs;

namespace TaskManagement.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<UserDto> GetByIdAsync(Guid id);
        Task<UserDto> GetByUsernameAsync(string username);
        Task<List<UserDto>> GetAllAsync();
        Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserDto> UpdateUserAsync(Guid id, UpdateUserDto updateUserDto);
        Task<UserDto> UploadProfileImageAsync(Guid id, IFormFile file);
        Task<UserDto> DeleteProfileImageAsync(Guid id);
        Task<bool> DeleteUserAsync(Guid id);
    }
}
