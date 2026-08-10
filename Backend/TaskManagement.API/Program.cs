using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

// 3. Servis Katmanı IoC Kayıtları
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IJwtService, JwtService>(); // JWT Servis Kaydı
builder.Services.AddScoped<IAuthService, AuthService>();

// 4. JWT Authentication Ayarları
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "MilsoftTaskManagementSystemSuperSecretKey2026!#";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// 5. Swagger / OpenAPI Servislerini Ekle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 6. Veritabanı Provider Seçimi (PostgreSQL veya Oracle)
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

// 7. Global Exception Handling Middleware
app.UseMiddleware<ExceptionMiddleware>();

// 8. HTTP Request Pipeline Yapılandırması
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 9. Auth Middleware'leri (Önce Authentication, Sonra Authorization)
app.UseAuthentication();
app.UseAuthorization();

// 10. Controller Endpoint Mapping
app.MapControllers();

app.Run();