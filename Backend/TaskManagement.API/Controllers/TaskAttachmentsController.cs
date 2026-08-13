using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/tasks/{taskId:guid}/attachments")]
    public class TaskAttachmentsController : ControllerBase
    {
        private readonly ITaskAttachmentService _attachmentService;

        public TaskAttachmentsController(ITaskAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(Guid taskId)
        {
            return Ok(await _attachmentService.GetAllAsync(taskId, GetUserId()));
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(Guid taskId, IFormFile file)
        {
            var attachment = await _attachmentService.UploadAsync(taskId, GetUserId(), file);
            return StatusCode(StatusCodes.Status201Created, attachment);
        }

        [HttpGet("{attachmentId:guid}/download")]
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
        public async Task<IActionResult> Delete(Guid taskId, Guid attachmentId)
        {
            var deleted = await _attachmentService.DeleteAsync(taskId, attachmentId, GetUserId());
            return deleted ? NoContent() : NotFound(new { message = "Silinecek dosya bulunamadı." });
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
