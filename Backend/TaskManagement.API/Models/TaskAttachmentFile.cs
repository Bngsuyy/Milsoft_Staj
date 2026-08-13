using TaskManagement.API.DTOs;

namespace TaskManagement.API.Models
{
    public class TaskAttachmentFile
    {
        public TaskAttachmentDto Metadata { get; set; } = new();
        public string PhysicalPath { get; set; } = string.Empty;
    }
}
