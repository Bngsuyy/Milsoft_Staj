using TaskManagement.API.Entities;

namespace TaskManagement.API.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}