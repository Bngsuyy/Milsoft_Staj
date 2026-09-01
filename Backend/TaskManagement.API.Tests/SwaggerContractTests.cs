using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Swagger;
using Xunit;

namespace TaskManagement.API.Tests;

public sealed class SwaggerContractTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public SwaggerContractTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void OpenApiDocument_DescribesEveryOperationAndItsContract()
    {
        var provider = _factory.Services.GetRequiredService<ISwaggerProvider>();
        var document = provider.GetSwagger("v1");
        var operations = GetOperations(document).ToList();

        Assert.Equal(28, operations.Count);
        Assert.DoesNotContain("/", document.Paths.Keys);
        Assert.Contains("Bearer", document.Components.SecuritySchemes.Keys);
        Assert.Equal(operations.Count, operations.Select(endpoint => endpoint.Operation.OperationId).Distinct().Count());

        foreach (var endpoint in operations)
        {
            Assert.False(
                string.IsNullOrWhiteSpace(endpoint.Operation.OperationId),
                $"{endpoint.Method} {endpoint.Path} için operationId eksik.");
            Assert.True(
                endpoint.Operation.Responses.ContainsKey("500"),
                $"{endpoint.Method} {endpoint.Path} için 500 yanıtı eksik.");
            Assert.Contains(
                endpoint.Operation.Responses,
                response => int.TryParse(response.Key, out var code) && code is >= 200 and < 300);

            foreach (var response in endpoint.Operation.Responses.Where(response =>
                         int.TryParse(response.Key, out var code) && code is >= 200 and < 300 && code != 204))
            {
                Assert.Contains(
                    response.Value.Content,
                    content => content.Value.Schema is not null);
            }
        }
    }

    [Fact]
    public void OpenApiDocument_AppliesBearerOnlyToProtectedOperations()
    {
        var provider = _factory.Services.GetRequiredService<ISwaggerProvider>();
        var document = provider.GetSwagger("v1");
        var operations = GetOperations(document).ToList();

        var anonymousRoutes = new HashSet<(string Path, OperationType Method)>
        {
            ("/api/Auth/login", OperationType.Post),
            ("/api/Auth/register", OperationType.Post)
        };

        foreach (var endpoint in operations)
        {
            if (anonymousRoutes.Contains((endpoint.Path, endpoint.Method)))
            {
                Assert.Empty(endpoint.Operation.Security);
                Assert.DoesNotContain("401", endpoint.Operation.Responses.Keys);
                continue;
            }

            Assert.NotEmpty(endpoint.Operation.Security);
            Assert.Contains("401", endpoint.Operation.Responses.Keys);
        }
    }

    private static IEnumerable<(string Path, OperationType Method, OpenApiOperation Operation)>
        GetOperations(OpenApiDocument document)
    {
        return document.Paths.SelectMany(path =>
            path.Value.Operations.Select(operation =>
                (path.Key, operation.Key, operation.Value)));
    }
}
