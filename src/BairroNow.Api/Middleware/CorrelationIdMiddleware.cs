using Serilog.Context;

namespace BairroNow.Api.Middleware;

/// <summary>
/// Assigns a correlation ID to every request and pushes it into the Serilog
/// LogContext so every log line downstream carries it. Echoes the ID back in
/// the X-Correlation-Id response header so a client that sees an error can
/// quote the exact ID for triage.
///
/// If the client supplies X-Correlation-Id themselves we honor it (lets a
/// distributed tracer stitch the chain together) — but we defensively cap the
/// length and strip anything that isn't safe for a header value.
/// </summary>
public class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-Id";
    private const int MaxLength = 64;

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string correlationId;
        if (context.Request.Headers.TryGetValue(HeaderName, out var supplied)
            && !string.IsNullOrWhiteSpace(supplied)
            && IsSafe(supplied!))
        {
            correlationId = supplied.ToString()!;
            if (correlationId.Length > MaxLength) correlationId = correlationId[..MaxLength];
        }
        else
        {
            // N (base32 without dashes) is compact enough for a header without
            // losing uniqueness. 32 chars.
            correlationId = Guid.NewGuid().ToString("N");
        }

        // Make it reachable from controllers / services via HttpContext.Items.
        context.Items["CorrelationId"] = correlationId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        // Scope the Serilog LogContext so every log line inside _next carries it.
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }

    private static bool IsSafe(string value)
    {
        // Printable ASCII only; no control chars, no CRLF injection.
        foreach (var ch in value)
        {
            if (ch < 0x20 || ch > 0x7E) return false;
        }
        return true;
    }
}
