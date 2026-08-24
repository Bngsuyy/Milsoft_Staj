using AutoMapper;
using TaskManagement.API.DTOs;
using TaskManagement.API.Entities;

namespace TaskManagement.API
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User Mappings
            CreateMap<CreateUserDto, User>();
            CreateMap<UpdateUserDto, User>()
                .ForMember(destination => destination.Email,
                    options => options.Condition(source => !string.IsNullOrWhiteSpace(source.Email)));
            CreateMap<User, UserDto>()
                .ForMember(destination => destination.ProfileImageUrl,
                    options => options.MapFrom(source => string.IsNullOrWhiteSpace(source.ProfileImagePath)
                        ? null
                        : $"/profile-images/{source.ProfileImagePath}"));

            // Category Mappings
            CreateMap<CreateCategoryDto, Category>();
            CreateMap<UpdateCategoryDto, Category>();
            CreateMap<Category, CategoryDto>();

            // Task Mappings
            CreateMap<CreateTaskDto, TaskItem>();
            CreateMap<UpdateTaskDto, TaskItem>();
            CreateMap<TaskItem, TaskItemDto>();

            // Comment and attachment mappings
            CreateMap<TaskComment, TaskCommentDto>()
                .ForMember(destination => destination.Username,
                    options => options.MapFrom(source => source.User.Username));
            CreateMap<TaskAttachment, TaskAttachmentDto>();
        }
    }
}
