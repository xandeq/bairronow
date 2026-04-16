using System.IO.Compression;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.ResponseCompression;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BairroNow.Api.Data;
using BairroNow.Api.Data.Seed;
using BairroNow.Api.Hubs;
using BairroNow.Api.Middleware;
using BairroNow.Api.Services;
using Serilog;
using Microsoft.Extensions.FileProviders;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Memory;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Serilog
    builder.Host.UseSerilog((context, services, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration)
            .WriteTo.Console());

    // DbContext
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            policy.WithOrigins(
                    builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
                .AllowCredentials()
                .AllowAnyHeader()
                .AllowAnyMethod()
                .WithExposedHeaders("X-Pagination", "Retry-After");
        });
    });

    // Rate Limiting
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = async (context, cancellationToken) =>
        {
            context.HttpContext.Response.Headers.RetryAfter = "60";
            await Task.CompletedTask;
        };

        options.AddPolicy("authenticated", context =>
            RateLimitPartition.GetSlidingWindowLimiter(
                context.User?.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));

        options.AddPolicy("public", context =>
            RateLimitPartition.GetSlidingWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 4,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));

        options.AddPolicy("feed-write", context =>
            RateLimitPartition.GetSlidingWindowLimiter(
                context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? context.User?.Identity?.Name
                    ?? context.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));
    });

    // JWT Authentication
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]
                        ?? throw new InvalidOperationException("JWT key not configured")))
            };
        })
        .AddGoogle(options =>
        {
            options.ClientId = builder.Configuration["Google:ClientId"] ?? "";
            options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? "";
            options.CallbackPath = "/api/v1/auth/google/callback";
            options.Events.OnTicketReceived = async ctx =>
            {
                ctx.HandleResponse();
                var email = ctx.Principal!.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
                var googleId = ctx.Principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
                var authService = ctx.HttpContext.RequestServices.GetRequiredService<IAuthService>();
                var frontendUrl = ctx.HttpContext.RequestServices.GetRequiredService<IConfiguration>()["FrontendUrl"] ?? "https://bairronow.com.br";
                var result = await authService.GoogleSignInAsync(email, googleId);
                ctx.Response.Redirect($"{frontendUrl}/auth/callback?token={result.Response?.AccessToken}&refresh={result.RefreshToken}");
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("Admin", policy =>
            policy.RequireAuthenticatedUser().RequireClaim("is_admin", "true"));
        options.AddPolicy("VerifiedOnly", policy =>
            policy.RequireAuthenticatedUser().RequireClaim("is_verified", "true"));
    });

    // Verification / bairro / CEP services
    builder.Services.AddMemoryCache();
    builder.Services.AddHttpClient<ICepLookupService, CepLookupService>(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(5);
    });
    builder.Services.AddScoped<IBairroService, BairroService>();
    builder.Services.AddScoped<IFileStorageService, FileStorageService>();
    builder.Services.AddScoped<IVerificationService, VerificationService>();

    // Feed services
    builder.Services.AddSingleton<IOffensiveWordFilter, OffensiveWordFilter>();
    builder.Services.AddScoped<IFeedQueryService, FeedQueryService>();
    builder.Services.AddScoped<IPostService, PostService>();
    builder.Services.AddScoped<ICommentService, CommentService>();
    builder.Services.AddScoped<ILikeService, LikeService>();
    builder.Services.AddScoped<IModerationService, ModerationService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();

    // Phase 4 (04-01) Marketplace + Ratings services
    builder.Services.AddScoped<IListingService, ListingService>();
    builder.Services.AddScoped<IRatingService, RatingService>();
    builder.Services.AddScoped<IChatService, ChatService>();

    // Phase 5 (05-01) Map + Groups services
    builder.Services.AddScoped<ICoordinateFuzzingService, CoordinateFuzzingService>();
    builder.Services.AddHostedService<GroupEventReminderService>();

    // RESEARCH §Pitfall 8: Use ArrayPool memory allocator with minimal pooling so the
    // sequential photo pipeline doesn't retain large managed buffers between requests on
    // shared hosting (SmarterASP single instance).
    Configuration.Default.MemoryAllocator = MemoryAllocator.Create(new MemoryAllocatorOptions
    {
        AllocationLimitMegabytes = 64
    });

    // Phase 4 chat-send rate limiter (D-12 hub) — 30 messages/min per user
    builder.Services.Configure<Microsoft.AspNetCore.RateLimiting.RateLimiterOptions>(opts => { });

    // Health checks — self + DB. Two endpoints below differentiate liveness
    // (process up?) from readiness (can we actually serve traffic?).
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AppDbContext>(
            name: "database",
            tags: new[] { "ready" });

    // Response compression — Brotli first (better ratio), then Gzip fallback.
    // EnableForHttps: Cloudflare is the only HTTPS-aware proxy in front of us and
    // already does compression at the edge, but enabling at the origin still helps
    // for CF-bypass paths and for payloads above CF's limits.
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
        options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
        {
            "application/json",
            "application/javascript",
            "text/json",
            "text/css",
            "image/svg+xml"
        });
    });
    builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
    builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

    // SignalR
    builder.Services.AddSignalR();

    // Controllers
    builder.Services.AddControllers();

    // Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "BairroNow API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    // FluentValidation
    builder.Services.AddValidatorsFromAssemblyContaining<Program>();

    // Auth Services
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IEmailService, ResendEmailService>();

    // Phase 6 (06-01) services
    builder.Services.AddHostedService<DigestSchedulerService>();
    builder.Services.AddHostedService<DocumentRetentionService>();
    builder.Services.AddHostedService<AnonymizationSchedulerService>();
    builder.Services.AddScoped<AccountService>();
    builder.Services.AddScoped<OcrService>();
    builder.Services.AddHttpClient();

    var app = builder.Build();

    // Apply migrations and seed Vila Velha bairros
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            db.Database.Migrate();
            if (!db.Bairros.Any())
            {
                db.Bairros.AddRange(VilaVelhaBairros.All);
                db.SaveChanges();
            }

            // Optional admin promotion via env var BAIRRONOW_ADMIN_EMAIL.
            // If set and a user with that email exists, ensure IsAdmin = true.
            // Does NOT auto-create the user — register them via the normal flow first.
            var adminEmail = Environment.GetEnvironmentVariable("BAIRRONOW_ADMIN_EMAIL");
            if (!string.IsNullOrWhiteSpace(adminEmail))
            {
                var normalized = adminEmail.Trim().ToLowerInvariant();
                var user = db.Users.FirstOrDefault(u => u.Email.ToLower() == normalized);
                if (user != null && !user.IsAdmin)
                {
                    user.IsAdmin = true;
                    db.SaveChanges();
                    Log.Information("Promoted {Email} to admin via BAIRRONOW_ADMIN_EMAIL", normalized);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Database migration/seed failed");
        }
    }

    // Middleware pipeline
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
        KnownNetworks = { },
        KnownProxies = { }
    });
    app.UseMiddleware<ExceptionHandlerMiddleware>();
    // SecurityHeadersMiddleware runs early via OnStarting so headers attach to
    // every response (controllers, static files, Swagger, error pages).
    app.UseMiddleware<SecurityHeadersMiddleware>();
    // Response compression must precede UseStaticFiles / MapControllers so the
    // middleware sees the body being written and can compress it.
    app.UseResponseCompression();
    // HttpsRedirection disabled: Cloudflare terminates TLS at edge, origin runs HTTP
    app.UseCors("Frontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseRateLimiter();
    app.UseMiddleware<AuditLoggingMiddleware>();

    // Static files for uploaded marketplace + chat images.
    // Cache-Control: public, max-age=31536000, immutable (Research Open Question 2)
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = ctx =>
        {
            var path = ctx.Context.Request.Path.Value ?? string.Empty;
            if (path.StartsWith("/uploads/listings/", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/uploads/chat/", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/uploads/posts/", StringComparison.OrdinalIgnoreCase))
            {
                ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";
            }
        }
    });

    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BairroNow API v1"));

    // Liveness: is the process up? (no dependency checks — always fast, always 200
    // unless Kestrel itself is broken). Used by SmarterASP/K8s-style probes that
    // want to know if they should restart us.
    app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = _ => false,
        ResponseWriter = WriteHealthResponse
    });

    // Readiness: can we serve real traffic? (includes DB probe). Used by a load
    // balancer / CF origin-health to decide whether to route requests here.
    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = hc => hc.Tags.Contains("ready"),
        ResponseWriter = WriteHealthResponse
    });

    // Back-compat: /health keeps the original shape so existing probes don't break.
    app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTime.UtcNow }));

    static Task WriteHealthResponse(HttpContext ctx,
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthReport report)
    {
        ctx.Response.ContentType = "application/json";
        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            totalDurationMs = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                durationMs = e.Value.Duration.TotalMilliseconds,
                error = e.Value.Exception?.Message
            })
        });
        return ctx.Response.WriteAsync(payload);
    }

    app.MapHub<NotificationHub>("/hubs/notifications");
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
