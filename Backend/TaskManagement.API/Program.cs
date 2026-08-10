using Microsoft.EntityFrameworkCore;
using TaskManagement.API; // AutoMapper MappingProfile için
using TaskManagement.API.Data;
using TaskManagement.API.Services; // UserService ve TaskService için
using TaskManagement.API.Services.Interfaces; // IUserService ve ITaskService için

var builder = WebApplication.CreateBuilder(args);

// 1. Controller Servislerini Ekle
builder.Services.AddControllers();

// 2. AutoMapper Servisini Kaydet
builder.Services.AddAutoMapper(typeof(MappingProfile));

// 3. Servis Katmanı (Service Layer) IoC Kayıtları
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITaskService, TaskService>();

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

// 6. HTTP Request Pipeline Yapılandırması
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// 7. Controller Endpoint Mapping
app.MapControllers();

app.Run();