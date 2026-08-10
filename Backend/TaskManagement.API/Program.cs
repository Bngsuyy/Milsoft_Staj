using Microsoft.EntityFrameworkCore;
using TaskManagement.API;
using TaskManagement.API.Data;
using TaskManagement.API.Middlewares;
using TaskManagement.API.Services;
using TaskManagement.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller Servislerini Ekle
builder.Services.AddControllers();

// 2. AutoMapper Servisini Kaydet
builder.Services.AddAutoMapper(typeof(MappingProfile));

// 3. Servis Katmanı (Service Layer) IoC Kayıtları
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();

// 4. Swagger / OpenAPI Servislerini Ekle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 5. Veritabanı Provider Seçimi (PostgreSQL veya Oracle)
var provider = builder.Configuration.GetValue<string>("DatabaseProvider");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (provider == "PostgreSQL")
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL"));
    }
    else if (provider == "Oracle")
    {
        options.UseOracle(builder.Configuration.GetConnectionString("Oracle"));
    }
});

var app = builder.Build();

// 6. Global Exception Handling Middleware
app.UseMiddleware<ExceptionMiddleware>();

// 7. HTTP Request Pipeline Yapılandırması
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// 8. Controller Endpoint Mapping
app.MapControllers();

app.Run();