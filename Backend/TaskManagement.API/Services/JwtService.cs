using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskManagement.API.Entities;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Services
{
    public class JwtService : IJwtService
    {
        private const double DefaultExpirationInMinutes = 120;

        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey ayarlanmamış.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Token içerisinde taşınacak kullanıcı bilgileri (Claims)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(ResolveExpirationInMinutes(jwtSettings["ExpirationInMinutes"])),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Ayar okunurken sunucunun bölgesel ayarına bağımlı kalmamak için InvariantCulture kullanılır.
        private static double ResolveExpirationInMinutes(string? configuredValue)
        {
            if (string.IsNullOrWhiteSpace(configuredValue))
                return DefaultExpirationInMinutes;

            var isParsed = double.TryParse(
                configuredValue,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var minutes);

            return isParsed && minutes > 0 ? minutes : DefaultExpirationInMinutes;
        }
    }
}
