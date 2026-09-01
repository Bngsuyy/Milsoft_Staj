using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Models;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/tasks/{taskId:guid}/comments")]
    [Produces("application/json")]
    public class TaskCommentsController : ControllerBase
    {
        private readonly ITaskCommentService _commentService;

        public TaskCommentsController(ITaskCommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<TaskCommentDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<TaskCommentDto>>> GetAll(Guid taskId)
        {
            return Ok(await _commentService.GetAllAsync(taskId, GetUserId()));
        }

        [HttpPost]
        [ProducesResponseType(typeof(TaskCommentDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<TaskCommentDto>> Create(Guid taskId, [FromBody] CreateTaskCommentDto createDto)
        {
            var comment = await _commentService.CreateAsync(taskId, GetUserId(), createDto);
            return StatusCode(StatusCodes.Status201Created, comment);
        }

        [HttpDelete("{commentId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Delete(Guid taskId, Guid commentId)
        {
            var deleted = await _commentService.DeleteAsync(taskId, commentId, GetUserId());
            return deleted
                ? NoContent()
                : NotFound(new ErrorDetails
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Silinecek yorum bulunamadı.",
                    TraceId = HttpContext.TraceIdentifier
                });
        }

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("Geçersiz token bilgisi.");

            return userId;
        }
    }
}
