using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.DTOs;
using TaskManagement.API.Services.Interfaces;

namespace TaskManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Geçersiz veya bulunamayan kullanıcı kimliği.");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] TaskFilterDto filterDto)
        {
            var userId = GetUserId();
            var tasks = await _taskService.GetAllTasksAsync(userId, filterDto);
            return Ok(tasks);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var userId = GetUserId();
            var task = await _taskService.GetTaskByIdAsync(id, userId);
            return Ok(task);
        }

        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdue([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var tasks = await _taskService.GetOverdueTasksAsync(GetUserId(), pageNumber, pageSize);
            return Ok(tasks);
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var statistics = await _taskService.GetStatisticsAsync(GetUserId());
            return Ok(statistics);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto createTaskDto)
        {
            var userId = GetUserId();
            var createdTask = await _taskService.CreateTaskAsync(createTaskDto, userId);
            return CreatedAtAction(nameof(GetById), new { id = createdTask.Id }, createdTask);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskDto updateTaskDto)
        {
            var userId = GetUserId();
            var updatedTask = await _taskService.UpdateTaskAsync(id, updateTaskDto, userId);
            return Ok(updatedTask);
        }

        [HttpPost("bulk/status")]
        public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkTaskStatusDto bulkStatusDto)
        {
            var affectedCount = await _taskService.BulkUpdateStatusAsync(GetUserId(), bulkStatusDto);
            return Ok(new BulkOperationResultDto { AffectedCount = affectedCount });
        }

        [HttpPost("bulk/delete")]
        public async Task<IActionResult> BulkDelete([FromBody] BulkTaskDeleteDto bulkDeleteDto)
        {
            var affectedCount = await _taskService.BulkDeleteAsync(GetUserId(), bulkDeleteDto);
            return Ok(new BulkOperationResultDto { AffectedCount = affectedCount });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = GetUserId();
            var result = await _taskService.DeleteTaskAsync(id, userId);
            if (!result)
                return NotFound(new { message = "Silinecek görev bulunamadı." });

            return NoContent();
        }
    }
}
