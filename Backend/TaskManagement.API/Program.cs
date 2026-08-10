using Microsoft.EntityFrameworkCore;
using TaskManagement.API; // AutoMapper MappingProfile için eklendi
using TaskManagement.API.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller Servislerini Ekle
builder.Services.AddControllers();

// 2. AutoMapper Servisini Kaydet
builder.Services.AddAutoMapper(typeof(MappingProfile));

// 3. Swagger / OpenAPI Servislerini Ekle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. Veritabanı Provider Seçimi (PostgreSQL veya Oracle)
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

// 5. HTTP Request Pipeline Yapılandırması
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

// 6. Controller Endpoint Mapping
app.MapControllers();

app.Run();