namespace BairroNow.Api.Middleware;

/// <summary>
/// Defense-in-depth security headers on every API response. Cloudflare may set
/// some of these at the edge, but the origin MUST NOT depend on that — direct
/// origin access (debug, internal health probes, Cloudflare bypass) should still
/// be hardened.
///
/// HSTS is only emitted when the request arrived over HTTPS (via
/// X-Forwarded-Proto from Cloudflare). Emitting HSTS over plaintext is an RFC
/// violation and some proxies strip it.
///
/// CSP is scoped for an API: it only matters for Swagger UI, error HTML, and
/// any static assets we serve. The frontend's own CSP is set separately by the
/// Next.js static-export .htaccess.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHostEnvironment _env;

    public SecurityHeadersMiddleware(RequestDelegate next, IHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Apply on the OnStarting callback so that endpoints (controllers, Swagger)
        // can't accidentally overwrite us later in the pipeline, and so headers are
        // set even when a response is written by UseStaticFiles before controllers.
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] =
                "accelerometer=(), camera=(), geolocation=(self), gyroscope=(), " +
                "magnetometer=(), microphone=(), payment=(), usb=()";

            // Swagger UI needs inline scripts + CDN resources in Development; keep
            // CSP permissive there. In prod the API never serves Swagger (it's
            // mapped unconditionally today, but the intent is API-only).
            if (_env.IsDevelopment())
            {
                headers["Content-Security-Policy"] =
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: blob:; " +
                    "connect-src 'self'; " +
                    "frame-ancestors 'none'";
            }
            else
            {
                headers["Content-Security-Policy"] =
                    "default-src 'none'; " +
                    "img-src 'self' data:; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "script-src 'self' 'unsafe-inline'; " +
                    "connect-src 'self'; " +
                    "frame-ancestors 'none'";
            }

            // HSTS: only over HTTPS. Cloudflare terminates TLS so the origin sees
            // HTTP, but X-Forwarded-Proto tells us the user's scheme.
            var isHttps = context.Request.IsHttps
                || string.Equals(context.Request.Headers["X-Forwarded-Proto"], "https",
                    StringComparison.OrdinalIgnoreCase);
            if (isHttps)
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }

            // ASP.NET Core auto-emits "Server: Kestrel" — drop it. Low value, small
            // fingerprint reduction.
            headers.Remove("Server");

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
