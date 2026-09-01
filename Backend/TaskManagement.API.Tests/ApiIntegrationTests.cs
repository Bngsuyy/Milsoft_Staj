using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TaskManagement.API.Data;
using Xunit;

namespace TaskManagement.API.Tests;

public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"api-tests-{Guid.NewGuid()}";

    public ApiWebApplicationFactory()
    {
        // Uygulama JWT ayarlarını Build() öncesinde okuduğu için yapılandırma
        // ortam değişkenleriyle verilir. Böylece depoda hiçbir anahtar tutulmaz.
        Environment.SetEnvironmentVariable(
            "JwtSettings__SecretKey",
            "integration-tests-only-secret-key-32-bytes-minimum");
        Environment.SetEnvironmentVariable("JwtSettings__Issuer", "TaskManagementAPI");
        Environment.SetEnvironmentVariable("JwtSettings__Audience", "TaskManagementUI");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}

public sealed class ApiIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public ApiIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AuthenticatedTaskFlow_WorksThroughHttpPipeline()
    {
        using var anonymousClient = CreateClient();
        var unauthorizedResponse = await anonymousClient.GetAsync("/api/Tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorizedResponse.StatusCode);

        var username = $"integration-{Guid.NewGuid():N}";
        var registerResponse = await anonymousClient.PostAsJsonAsync("/api/Auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "Integration123!",
            firstName = "API",
            lastName = "Test"
        });
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var loginResponse = await anonymousClient.PostAsJsonAsync("/api/Auth/login", new
        {
            username,
            password = "Integration123!"
        });
        loginResponse.EnsureSuccessStatusCode();

        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginPayload.GetProperty("token").GetString();
        Assert.False(string.IsNullOrWhiteSpace(token));

        using var authenticatedClient = CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await authenticatedClient.PostAsJsonAsync("/api/Tasks", new
        {
            title = "HTTP entegrasyon görevi",
            description = "Controller, JWT ve servis zinciri testi",
            priority = "Normal",
            dueDate = (DateTime?)null,
            categoryId = (Guid?)null
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdTask = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("HTTP entegrasyon görevi", createdTask.GetProperty("title").GetString());

        var statistics = await authenticatedClient.GetFromJsonAsync<JsonElement>(
            "/api/Tasks/statistics");
        Assert.Equal(1, statistics.GetProperty("total").GetInt32());
        Assert.Equal(1, statistics.GetProperty("pending").GetInt32());
    }

    [Fact]
    public async Task ApiErrors_UseDocumentedErrorDetailsContract()
    {
        using var client = CreateClient();

        var unauthorizedResponse = await client.GetAsync("/api/Tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorizedResponse.StatusCode);
        var unauthorizedError = await unauthorizedResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(401, unauthorizedError.GetProperty("statusCode").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(unauthorizedError.GetProperty("message").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(unauthorizedError.GetProperty("traceId").GetString()));

        var validationResponse = await client.PostAsJsonAsync("/api/Auth/register", new { });
        Assert.Equal(HttpStatusCode.BadRequest, validationResponse.StatusCode);
        var validationError = await validationResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(400, validationError.GetProperty("statusCode").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(validationError.GetProperty("message").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(validationError.GetProperty("traceId").GetString()));
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
    }
}
