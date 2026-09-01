using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;
using TaskManagement.API;
using TaskManagement.API.Data;
using TaskManagement.API.Middlewares;
using TaskManagement.API.Models;
using TaskManagement.API.Services;
using TaskManagement.API.Services.Interfaces;
using TaskManagement.API.Swagger;

var builder = WebApplication.CreateBuilder(args);
var maxFileSize = builder.Configuration.GetValue<long?>("FileUpload:MaxFileSizeBytes")
    ?? 10 * 1024 * 1024;
builder.WebHost.ConfigureKestrel(options =>
    options.Limits.MaxRequestBodySize = maxFileSize + 64 * 1024);

// 1. CORS Ayarı (Frontend Erişimi İçin)
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 2. Controller Servislerini Ekle
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var validationErrors = context.ModelState.Values
            .SelectMany(value => value.Errors)
            .Select(error => error.ErrorMessage)
            .Where(message => !string.IsNullOrWhiteSpace(message))
            .Distinct()
            .ToArray();

        return new BadRequestObjectResult(new ErrorDetails
        {
            StatusCode = StatusCodes.Status400BadRequest,
            Message = validationErrors.Length == 0
                ? "İstek doğrulaması başarısız oldu."
                : string.Join(" ", validationErrors),
            TraceId = context.HttpContext.TraceIdentifier
        });
    };
});
builder.Services.Configure<FormOptions>(options =>
    options.MultipartBodyLengthLimit = maxFileSize + 64 * 1024);

// 3. AutoMapper Servisini Kaydet. AutoMapper 13+ ile DI desteği çekirdek pakettedir.
// Lisans anahtarı depoda tutulmaz; paket AUTOMAPPER_LICENSE_KEY ortam değişkenini
// otomatik olarak okuyabilir.
builder.Services.AddAutoMapper(_ => { }, typeof(MappingProfile));

// 4. Servis Katmanı IoC Kayıtları
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<ITaskAttachmentService, TaskAttachmentService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// 5. JWT Authentication Ayarları
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];
if (string.IsNullOrWhiteSpace(secretKey) || Encoding.UTF8.GetByteCount(secretKey) < 32)
{
    throw new InvalidOperationException("JwtSettings:SecretKey en az 32 byte olmalıdır.");
}

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
        ValidIssuer = jwtSettings["Issuer"]
            ?? throw new InvalidOperationException("JwtSettings:Issuer ayarlanmamış."),
        ValidAudience = jwtSettings["Audience"]
            ?? throw new InvalidOperationException("JwtSettings:Audience ayarlanmamış."),
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
    options.Events = new JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(new ErrorDetails
            {
                StatusCode = StatusCodes.Status401Unauthorized,
                Message = "JWT eksik, geçersiz veya süresi dolmuş.",
                TraceId = context.HttpContext.TraceIdentifier
            }.ToString());
        }
    };
});

// 6. Swagger JWT Bearer Güvenlik Dokümantasyonu
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Task Management API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.CustomOperationIds(apiDescription =>
        $"{apiDescription.ActionDescriptor.RouteValues["controller"]}_{apiDescription.ActionDescriptor.RouteValues["action"]}");
    c.OperationFilter<SwaggerOperationFilter>();
});

// 7. Veritabanı Provider Seçimi (PostgreSQL veya Oracle)
var provider = builder.Configuration.GetValue<string>("DatabaseProvider")?.Trim();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (provider?.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
    {
        var connectionString = builder.Configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL bağlantı dizesi ayarlanmamış.");
        options.UseNpgsql(connectionString);
    }
    else if (provider?.Equals("Oracle", StringComparison.OrdinalIgnoreCase) == true)
    {
        var connectionString = builder.Configuration.GetConnectionString("Oracle")
            ?? throw new InvalidOperationException("Oracle bağlantı dizesi ayarlanmamış.");
        options.UseOracle(connectionString);
    }
    else
    {
        throw new InvalidOperationException(
            "DatabaseProvider değeri 'PostgreSQL' veya 'Oracle' olmalıdır.");
    }
});

var app = builder.Build();

app.UseStaticFiles();

// 8. Global Exception Handling Middleware
app.UseMiddleware<ExceptionMiddleware>();

// 9. HTTP Request Pipeline Yapılandırması
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Task Management API v1");
        options.DocumentTitle = "Task Management API - Swagger";
        options.DisplayOperationId();
        options.DisplayRequestDuration();
        options.EnablePersistAuthorization();
        options.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
        options.DefaultModelsExpandDepth(1);
    });
}

app.UseHttpsRedirection();

// 10. CORS Middleware
app.UseCors("AllowFrontend");

// 11. Auth Middleware'leri
app.UseAuthentication();
app.UseAuthorization();

// 12. Controller Endpoint Mapping
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();

public partial class Program;
