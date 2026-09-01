using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using TaskManagement.API.Models;

namespace TaskManagement.API.Swagger;

public sealed class SwaggerOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var methodAttributes = context.MethodInfo.GetCustomAttributes(inherit: true);
        var controllerAttributes = context.MethodInfo.DeclaringType?.GetCustomAttributes(inherit: true)
            ?? Array.Empty<object>();
        var attributes = methodAttributes.Concat(controllerAttributes).ToArray();

        var isAnonymous = attributes.OfType<IAllowAnonymous>().Any();
        var isAuthorized = !isAnonymous && attributes.OfType<IAuthorizeData>().Any();

        operation.Security = isAuthorized
            ? new List<OpenApiSecurityRequirement>
            {
                new()
                {
                    [new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    }] = Array.Empty<string>()
                }
            }
            : new List<OpenApiSecurityRequirement>();

        var errorSchema = context.SchemaGenerator.GenerateSchema(
            typeof(ErrorDetails),
            context.SchemaRepository);

        AddErrorResponse(operation, "500", "Sunucuda beklenmeyen bir hata oluştu.", errorSchema);

        if (isAuthorized)
        {
            AddErrorResponse(operation, "401", "JWT eksik, geçersiz veya süresi dolmuş.", errorSchema);
        }

        if (operation.RequestBody is not null || operation.Parameters.Any())
        {
            AddErrorResponse(operation, "400", "İstek doğrulaması başarısız oldu.", errorSchema);
        }

        var canReturnNotFound = operation.Parameters.Any(parameter => parameter.In == ParameterLocation.Path)
            || context.MethodInfo.Name.Contains("Profile", StringComparison.Ordinal);
        if (canReturnNotFound)
        {
            AddErrorResponse(operation, "404", "İstenen kaynak bulunamadı veya kullanıcıya ait değil.", errorSchema);
        }

        if (context.ApiDescription.HttpMethod is "POST" or "PUT" or "DELETE")
        {
            AddErrorResponse(operation, "409", "İstek benzersiz alan veya ilişki kuralıyla çakıştı.", errorSchema);
        }
    }

    private static void AddErrorResponse(
        OpenApiOperation operation,
        string statusCode,
        string description,
        OpenApiSchema schema)
    {
        if (operation.Responses.ContainsKey(statusCode))
            return;

        operation.Responses[statusCode] = new OpenApiResponse
        {
            Description = description,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new() { Schema = schema }
            }
        };
    }
}
