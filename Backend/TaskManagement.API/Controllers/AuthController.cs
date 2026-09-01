using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public AuthController(IAuthService authService, IUserService userService)
        {
            _authService = authService;
            _userService = userService;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<UserDto>> Register([FromBody] CreateUserDto registerDto)
        {
            var user = await _authService.RegisterAsync(registerDto);
            return StatusCode(StatusCodes.Status201Created, user);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            var token = await _authService.LoginAsync(loginDto);
            return Ok(new LoginResponseDto { Token = token });
        }

        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            var user = await _userService.GetByIdAsync(GetUserId());
            return Ok(user);
        }

        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateUserDto updateUserDto)
        {
            var user = await _userService.UpdateUserAsync(GetUserId(), updateUserDto);
            return Ok(user);
        }

        [HttpPost("profile/image")]
        [Authorize]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(5 * 1024 * 1024 + 64 * 1024)]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserDto>> UploadProfileImage(IFormFile file)
        {
            var user = await _userService.UploadProfileImageAsync(GetUserId(), file);
            return Ok(user);
        }

        [HttpDelete("profile/image")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<UserDto>> DeleteProfileImage()
        {
            var user = await _userService.DeleteProfileImageAsync(GetUserId());
            return Ok(user);
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Geçersiz token bilgisi.");

            return userId;
        }
    }
}
