using System.Net;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Models;

namespace TaskManagement.API.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                if (httpContext.Response.HasStarted)
                    throw;

                _logger.LogError(ex, "İstek işlenirken bir hata oluştu: {Message}", ex.Message);
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new ErrorDetails
            {
                TraceId = context.TraceIdentifier
            };

            switch (exception)
            {
                case KeyNotFoundException:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = exception.Message;
                    break;

                case InvalidOperationException:
                case ArgumentException:
                case BadHttpRequestException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = exception.Message;
                    break;

                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = exception.Message;
                    break;

                case DbUpdateException:
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = "Kayıt, benzersiz alan veya ilişki kuralıyla çakışıyor.";
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.StatusCode = context.Response.StatusCode;
                    response.Message = "Sunucuda beklenmeyen bir hata oluştu.";
                    response.Detailed = _env.IsDevelopment() ? exception.StackTrace : null;
                    break;
            }

            return context.Response.WriteAsync(response.ToString());
        }
    }
}
