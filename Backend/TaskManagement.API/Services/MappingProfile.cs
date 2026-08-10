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
            CreateMap<UserRegisterDto, User>();
            CreateMap<User, UserResponseDto>();

            // Category Mappings
            CreateMap<CategoryCreateDto, Category>();
            CreateMap<Category, CategoryResponseDto>();

            // Task Mappings
            CreateMap<TaskCreateDto, TaskItem>();
            CreateMap<TaskItem, TaskResponseDto>();
        }
    }
}