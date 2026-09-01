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
    [Route("api/tasks/{taskId:guid}/attachments")]
    [Produces("application/json")]
    public class TaskAttachmentsController : ControllerBase
    {
        private readonly ITaskAttachmentService _attachmentService;

        public TaskAttachmentsController(ITaskAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<TaskAttachmentDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<TaskAttachmentDto>>> GetAll(Guid taskId)
        {
            return Ok(await _attachmentService.GetAllAsync(taskId, GetUserId()));
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(TaskAttachmentDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<TaskAttachmentDto>> Upload(Guid taskId, IFormFile file)
        {
            var attachment = await _attachmentService.UploadAsync(taskId, GetUserId(), file);
            return StatusCode(StatusCodes.Status201Created, attachment);
        }

        [HttpGet("{attachmentId:guid}/download")]
        [Produces("application/octet-stream")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> Download(Guid taskId, Guid attachmentId)
        {
            var file = await _attachmentService.GetFileAsync(taskId, attachmentId, GetUserId());
            return PhysicalFile(
                file.PhysicalPath,
                file.Metadata.ContentType,
                file.Metadata.FileName,
                enableRangeProcessing: true);
        }

        [HttpDelete("{attachmentId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Delete(Guid taskId, Guid attachmentId)
        {
            var deleted = await _attachmentService.DeleteAsync(taskId, attachmentId, GetUserId());
            return deleted
                ? NoContent()
                : NotFound(new ErrorDetails
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = "Silinecek dosya bulunamadı.",
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
