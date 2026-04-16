using System.Security.Claims;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Middleware;

public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly HashSet<string> AuditedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "PATCH", "DELETE"
    };

    public AuditLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        await _next(context);

        if (!AuditedMethods.Contains(context.Request.Method))
            return;

        if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 300)
            return;

        try
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userEmail = context.User.FindFirstValue(ClaimTypes.Email);

            var auditLog = new AuditLog
            {
                Action = $"{context.Request.Method} {context.Request.Path}",
                UserId = Guid.TryParse(userId, out var uid) ? uid : null,
                UserEmail = userEmail,
                IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                Timestamp = DateTime.UtcNow
            };

            dbContext.AuditLogs.Add(auditLog);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<AuditLoggingMiddleware>>();
            logger.LogWarning(ex, "Failed to write audit log");
        }
    }
}
