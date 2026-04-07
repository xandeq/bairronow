# Phase 1: Infrastructure + Auth - Research

**Researched:** 2026-04-05
**Domain:** Infrastructure provisioning, cross-origin JWT authentication, .NET 8 + Next.js 15 deployment
**Confidence:** HIGH

## Summary

Phase 1 provisions all infrastructure (domain, DNS, hosting) and implements end-to-end JWT authentication across two separate hosts: HostGator (static Next.js frontend) and SmarterASP (.NET 8 API + SQL Server). The critical technical risk is cross-origin cookie handling for refresh tokens -- the frontend and backend live on different domains, requiring `SameSite=None; Secure` cookies with proper CORS credentials configuration.

The stack is fully decided (see CLAUDE.md). No library choices to make. Research focuses on deployment mechanics, cross-origin auth patterns, and pitfalls specific to shared hosting constraints.

**Primary recommendation:** Prove the CORS + httpOnly cookie flow end-to-end in the first backend task before building any auth logic. If cross-origin cookies fail, the architecture needs a fallback (e.g., refresh token in memory + silent re-auth).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-001 | Sign up with email/password (validation rules) | .NET 8 Identity-free JWT pattern + FluentValidation |
| AUTH-002 | JWT (15min) + refresh token (7d, rotating, httpOnly cookie) | Cross-origin cookie pattern with SameSite=None; manual Partitioned header on .NET 8 |
| AUTH-003 | Logout invalidates refresh token server-side, logout-all-devices | RefreshToken table with revocation flag |
| AUTH-004 | Password reset via email with 1h TTL link | SMTP from SmarterASP or external (SendGrid free tier) |
| AUTH-005 | XSS/injection sanitization, parameterized queries, HTML encoding | EF Core parameterized by default; HtmlEncoder for output |
| AUTH-006 | Rate limiting: 100/min auth, 20/min public, 429+Retry-After | Built-in SlidingWindowLimiter middleware in .NET 8 |
| AUTH-007 | CORS for authorized domains only, credentials enabled | Explicit origin allowlist, AllowCredentials(), explicit headers |
| AUTH-008 | HTTPS/TLS, HTTP->HTTPS redirect, HSTS | Cloudflare Full (Strict) SSL + HSTS header in middleware |
| AUTH-011 | Account lockout after 5 failed attempts (15min), email notification | FailedLoginAttempts column + lockout timestamp in Users table |
| INF-001 | Audit logging (who, when, what, IP, 12mo retention) | Serilog + SQL Server sink (AuditLogs table) |
| INF-002 | SignalR for real-time | SignalR hub scaffolding (placeholder, full use in later phases) |
| INF-003 | Secrets in environment variables, zero hardcoded | appsettings.json for structure, env vars override in production |
| INF-004 | RESTful API /api/v1/ with Swagger | Swashbuckle.AspNetCore with versioned route prefix |
| UXDS-01 | Mobile-first responsive (Tailwind CSS) | Next.js 15 + Tailwind 3.4 static export |
| UXDS-03 | Portuguese (PT-BR) only | No i18n library needed; hardcode PT-BR strings |
| LGPD-01 | Privacy consent at signup | Checkbox + AcceptedPrivacyPolicyVersion in Users table |
| LGPD-05 | Privacy policy page accessible from all screens | Static page in Next.js, link in layout footer |
</phase_requirements>

## Standard Stack

All libraries are locked decisions from CLAUDE.md. No alternatives to consider.

### Core (Phase 1 relevant)
| Library | Purpose | Notes |
|---------|---------|-------|
| .NET 8.0 | Web API | Target framework for SmarterASP |
| EF Core 8.0 | ORM + migrations | SQL Server provider |
| FluentValidation 12.x | Request validation | Registration/login DTOs |
| Serilog 4.x | Structured logging | + Serilog.Sinks.MSSqlServer for audit |
| Swashbuckle.AspNetCore | Swagger/OpenAPI | Auto-generated docs at /api/v1/swagger |
| Next.js 15.x | Frontend (static export) | `output: 'export'` in next.config |
| Tailwind CSS 3.4.x | Styling | Mobile-first |
| Zustand 5.x | Auth state | JWT token + user info in memory |
| Axios 1.7.x | HTTP client | Interceptors for token refresh |
| react-hook-form 7.x + zod 3.x | Form validation | Registration/login forms |
| @microsoft/signalr 8.x | SignalR client | Placeholder hub connection |

### Installation

**Backend (.NET):**
```bash
dotnet new webapi -n NossoVizinho.Api --framework net8.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package FluentValidation.AspNetCore
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.MSSqlServer
dotnet add package Swashbuckle.AspNetCore
dotnet add package System.IdentityModel.Tokens.Jwt
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package MediatR
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
```

**Frontend (Next.js):**
```bash
npx create-next-app@latest nosso-vizinho-web --typescript --tailwind --eslint --app --src-dir
cd nosso-vizinho-web
npm install axios zustand react-hook-form zod @hookform/resolvers @microsoft/signalr
npm install -D @types/node
```

## Architecture Patterns

### Recommended Project Structure

```
# Backend
src/NossoVizinho.Api/
  Controllers/
    v1/
      AuthController.cs          # Register, Login, Refresh, Logout, ForgotPassword, ResetPassword
  Models/
    Entities/
      User.cs
      RefreshToken.cs
      AuditLog.cs
    DTOs/
      RegisterRequest.cs
      LoginRequest.cs
      AuthResponse.cs
  Services/
    IAuthService.cs
    AuthService.cs
    ITokenService.cs
    TokenService.cs
    IEmailService.cs
    EmailService.cs
  Validators/
    RegisterRequestValidator.cs
    LoginRequestValidator.cs
  Data/
    AppDbContext.cs
    Migrations/
  Middleware/
    AuditLoggingMiddleware.cs
    ExceptionHandlerMiddleware.cs
  Program.cs
  appsettings.json

# Frontend
src/nosso-vizinho-web/
  src/
    app/
      layout.tsx               # Global layout with footer (privacy policy link)
      page.tsx                 # Landing / home
      (auth)/
        login/page.tsx
        register/page.tsx
        forgot-password/page.tsx
        reset-password/page.tsx
      privacy-policy/page.tsx  # LGPD-05
    lib/
      api.ts                   # Axios instance with interceptors
      auth.ts                  # Zustand auth store
    components/
      ui/                      # Shared UI components
      forms/
        LoginForm.tsx
        RegisterForm.tsx
    types/
      auth.ts
  next.config.ts               # output: 'export', trailingSlash: true
  tailwind.config.ts
```

### Pattern 1: Cross-Origin JWT + Refresh Token

**What:** JWT access token in memory (Zustand), refresh token in httpOnly cookie set by the API.

**Critical constraint:** Frontend (HostGator) and backend (SmarterASP) are on different domains. This makes refresh token cookies "third-party cookies."

**Required cookie settings (.NET 8):**
```csharp
// .NET 8 does NOT have CookieOptions.Partitioned (that's .NET 9+)
// Must manually append Partitioned attribute
Response.Cookies.Append("refreshToken", token, new CookieOptions
{
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.None, // Required for cross-origin
    Expires = DateTime.UtcNow.AddDays(7),
    Path = "/api/v1/auth",
    Domain = null // Let browser set it to the API domain
});

// For .NET 8, manually add Partitioned via header append:
Response.Headers.Append("Set-Cookie",
    Response.Headers["Set-Cookie"].ToString().Replace(
        "SameSite=None",
        "SameSite=None; Partitioned"));
```

**Required CORS configuration:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("https://bairronow.com.br", "https://www.bairronow.com.br")
              .AllowCredentials()  // MANDATORY for cookies
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("X-Pagination");
    });
});
```

**Required Axios configuration (frontend):**
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // https://api-nossovizinho.site4now.net
  withCredentials: true, // MANDATORY - sends cookies cross-origin
});

// Interceptor: on 401, try /auth/refresh then retry original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await api.post('/api/v1/auth/refresh');
        useAuthStore.getState().setAccessToken(data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Pattern 2: Rate Limiting with Built-in Middleware

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
    };

    // Authenticated: 100/min
    options.AddSlidingWindowLimiter("authenticated", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 6;
        opt.PermitLimit = 100;
        opt.QueueLimit = 0;
    });

    // Public (login, register): 20/min
    options.AddSlidingWindowLimiter("public", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.SegmentsPerWindow = 4;
        opt.PermitLimit = 20;
        opt.QueueLimit = 0;
    });
});
```

### Pattern 3: Audit Logging Middleware

```csharp
// Serilog SQL Server sink for AuditLogs table
Log.Logger = new LoggerConfiguration()
    .WriteTo.MSSqlServer(
        connectionString: builder.Configuration.GetConnectionString("Default"),
        sinkOptions: new MSSqlServerSinkOptions
        {
            TableName = "AuditLogs",
            AutoCreateSqlTable = true
        },
        columnOptions: new ColumnOptions()) // Customize columns
    .CreateLogger();
```

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** XSS-vulnerable. Keep access token in Zustand (memory only). Refresh token in httpOnly cookie.
- **Using `AllowAnyOrigin()` with `AllowCredentials()`:** .NET throws at runtime. Must specify exact origins.
- **Wildcard CORS in production:** Never `*`. Always explicit allowed origins.
- **Refresh token without rotation:** Each refresh must issue a NEW refresh token and invalidate the old one (token rotation).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash | `BCrypt.Net-Next` or `Microsoft.AspNetCore.Identity.PasswordHasher` | Bcrypt with salt, constant-time comparison |
| JWT generation | Manual string building | `System.IdentityModel.Tokens.Jwt` | Standard claims, proper signing, validation |
| Input validation | Manual if/else | FluentValidation | Testable, declarative, reusable rules |
| Rate limiting | Custom counter middleware | Built-in `AddRateLimiter()` | Thread-safe, sliding window, per-policy |
| API docs | Manual Markdown | Swashbuckle (Swagger) | Auto-generated from controllers, always current |
| Email sending | Raw SMTP client | A lightweight wrapper or SendGrid free tier | Retry, templates, deliverability |

## Common Pitfalls

### Pitfall 1: Third-Party Cookie Blocking
**What goes wrong:** Modern browsers (Chrome 2024+, Firefox, Safari) block third-party cookies by default. Cross-domain httpOnly cookies silently fail.
**Why it happens:** Frontend on bairronow.com.br, API on site4now.net -- different registrable domains.
**How to avoid:** Use `SameSite=None; Secure; Partitioned` on cookies. Test in Chrome Incognito. Have a fallback plan: if cookies fail, store refresh token in memory and accept that page refresh = re-login.
**Warning signs:** Login works but user gets logged out on page navigation or refresh. 401s on refresh endpoint.

### Pitfall 2: Next.js Static Export Limitations
**What goes wrong:** Using server-only features (API routes, Server Actions, middleware, dynamic routes without generateStaticParams) causes build failure.
**Why it happens:** `output: 'export'` generates pure HTML/CSS/JS -- no Node.js server.
**How to avoid:** All data fetching via client-side API calls (axios). No `getServerSideProps`. No API routes. Use `generateStaticParams` for any dynamic paths or avoid them in Phase 1.
**Warning signs:** `next build` errors mentioning "API routes" or "dynamic server usage."

### Pitfall 3: SmarterASP Connection String Format
**What goes wrong:** EF Core can't connect to SQL Server on first deploy.
**Why it happens:** SmarterASP provides a specific server name (not localhost), and the connection string format must match their environment.
**How to avoid:** Use the connection string from SmarterASP control panel verbatim. Format: `Server=SQL8005.site4now.net;Database=db_XXXXX;User Id=db_XXXXX_admin;Password=XXXX;TrustServerCertificate=True;MultipleActiveResultSets=True`
**Warning signs:** SqlException on startup. Timeout connecting to database.

### Pitfall 4: HostGator .htaccess for SPA Routing
**What goes wrong:** Direct URL access (e.g., /login) returns 404 on HostGator.
**Why it happens:** Apache doesn't know about client-side routes. Needs rewrite rules.
**How to avoid:** Add `.htaccess` to the `out/` directory:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```
Also set `trailingSlash: true` in next.config -- this generates `/login/index.html` which Apache serves natively without rewrite.

### Pitfall 5: CORS Preflight on SmarterASP/IIS
**What goes wrong:** OPTIONS preflight requests return 405 Method Not Allowed.
**Why it happens:** IIS handles OPTIONS before ASP.NET Core middleware runs.
**How to avoid:** Add to web.config:
```xml
<system.webServer>
  <handlers>
    <remove name="OPTIONSVerbHandler" />
  </handlers>
</system.webServer>
```

## Code Examples

### User Entity (EF Core)
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool EmailConfirmed { get; set; }
    public string? EmailConfirmationToken { get; set; }
    public DateTime? EmailConfirmationTokenExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEnd { get; set; }
    public bool AcceptedPrivacyPolicy { get; set; }
    public int AcceptedPrivacyPolicyVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty; // Hashed
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public bool IsRevoked { get; set; }
    public string? RevokedByIp { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
}
```

### Registration Validator (FluentValidation)
```csharp
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail obrigatorio.")
            .EmailAddress().WithMessage("E-mail invalido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha obrigatoria.")
            .MinimumLength(8).WithMessage("Senha deve ter no minimo 8 caracteres.")
            .Matches("[A-Z]").WithMessage("Senha deve conter pelo menos uma letra maiuscula.")
            .Matches("[0-9]").WithMessage("Senha deve conter pelo menos um numero.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Senha deve conter pelo menos um caractere especial.");

        RuleFor(x => x.AcceptedPrivacyPolicy)
            .Equal(true).WithMessage("Voce deve aceitar a politica de privacidade.");
    }
}
```

### Next.js Static Export Config
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (Backend) | xUnit 2.9.x + Moq 4.20.x + FluentAssertions 7.x |
| Framework (Frontend) | Jest 29.x + React Testing Library 16.x |
| Config file (Backend) | None yet -- Wave 0 |
| Config file (Frontend) | jest.config.ts -- created by create-next-app |
| Quick run (Backend) | `dotnet test --filter "Category=Unit" --no-build -v q` |
| Quick run (Frontend) | `npx jest --watchAll=false --passWithNoTests` |
| Full suite | `dotnet test && cd nosso-vizinho-web && npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-001 | Registration validation (email, password rules) | unit | `dotnet test --filter RegisterRequestValidatorTests` | Wave 0 |
| AUTH-002 | JWT generation + refresh token rotation | unit | `dotnet test --filter TokenServiceTests` | Wave 0 |
| AUTH-003 | Logout revokes refresh token | unit | `dotnet test --filter AuthServiceTests` | Wave 0 |
| AUTH-004 | Password reset token generation + validation | unit | `dotnet test --filter PasswordResetTests` | Wave 0 |
| AUTH-005 | Parameterized queries (EF Core default) | integration | Manual -- verify EF Core generated SQL | manual-only |
| AUTH-006 | Rate limiting returns 429 | integration | `dotnet test --filter RateLimitTests` | Wave 0 |
| AUTH-007 | CORS rejects unauthorized origins | integration | `dotnet test --filter CorsTests` | Wave 0 |
| AUTH-008 | HTTPS redirect + HSTS header | integration | Manual -- verify in browser | manual-only |
| AUTH-011 | Account lockout after 5 failures | unit | `dotnet test --filter AccountLockoutTests` | Wave 0 |
| INF-001 | Audit log written on admin actions | unit | `dotnet test --filter AuditLogTests` | Wave 0 |
| INF-004 | Swagger serves at /api/v1/swagger | smoke | `curl -s -o /dev/null -w "%{http_code}" https://API/swagger` | manual-only |
| LGPD-01 | Registration requires privacy acceptance | unit | Covered by AUTH-001 validator test | Wave 0 |

### Wave 0 Gaps
- [ ] `tests/NossoVizinho.Api.Tests/` -- entire test project (create with `dotnet new xunit`)
- [ ] `tests/NossoVizinho.Api.Tests/Validators/RegisterRequestValidatorTests.cs`
- [ ] `tests/NossoVizinho.Api.Tests/Services/TokenServiceTests.cs`
- [ ] `tests/NossoVizinho.Api.Tests/Services/AuthServiceTests.cs`
- [ ] Backend test packages: `Moq`, `FluentAssertions`, `Microsoft.AspNetCore.Mvc.Testing`
- [ ] Frontend: Jest config comes with create-next-app, but auth component tests needed

## Open Questions

1. **SmarterASP email sending**
   - What we know: SmarterASP likely has SMTP available, but limits and configuration unknown.
   - What's unclear: Whether SmarterASP SMTP is reliable enough or if SendGrid free tier (100 emails/day) is better.
   - Recommendation: Try SmarterASP SMTP first. If unreliable, switch to SendGrid. Abstract behind IEmailService interface so swapping is trivial.

2. **SmarterASP .NET 8 availability**
   - What we know: SmarterASP advertises .NET 8 support.
   - What's unclear: Whether their IIS setup is fully compatible (module version, etc).
   - Recommendation: Deploy a minimal "hello world" .NET 8 API as the very first task to validate.

3. **Registro.br domain availability**
   - What we know: bairronow.com.br is the target domain.
   - What's unclear: Whether the domain is available.
   - Recommendation: Check availability first. If taken, have alternatives ready (meu-vizinho.com.br, vizinhosaqui.com.br).

## Sources

### Primary (HIGH confidence)
- [Next.js Static Exports Guide](https://nextjs.org/docs/app/guides/static-exports) -- output: 'export' configuration
- [ASP.NET Core Rate Limiting](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-8.0) -- SlidingWindowLimiter
- [ASP.NET Core SameSite Cookies](https://learn.microsoft.com/en-us/aspnet/core/security/samesite?view=aspnetcore-10.0) -- SameSite=None config
- [Microsoft Q&A: Cross-Origin Refresh Tokens](https://learn.microsoft.com/en-us/answers/questions/1665709/how-do-i-keep-jwt-refresh-tokens-in-cross-origin-c) -- CHIPS/Partitioned cookies
- [dotnet/aspnetcore#55370](https://github.com/dotnet/aspnetcore/issues/55370) -- Partitioned cookie support (NOT in .NET 8, manual header needed)

### Secondary (MEDIUM confidence)
- [SmarterASP.NET Hosting](https://www.smarterasp.net/asp.net_hosting) -- .NET 8 support confirmed on marketing page
- [SmarterASP Deploy Guide](https://www.smarterasp.net/support/kb/a2286/how-to-publish-asp_net-core-web-app-visual-studio-2022.aspx) -- Web Deploy / FTP publish
- [Medium: Secure .NET 8 APIs JWT+CORS+Cookies](https://medium.com/@karthikns999/secure-dotnet8-webapi-security-jwt-cors-cookies-2025-3688ba32cfb3)

### Tertiary (LOW confidence)
- SmarterASP SQL Server connection string format -- inferred from common patterns, needs verification from actual control panel

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all locked in CLAUDE.md, no choices to make
- Architecture: HIGH -- standard .NET 8 + Next.js 15 patterns, well-documented
- Cross-origin cookies: MEDIUM -- SameSite=None works today but third-party cookie deprecation is ongoing; Partitioned attribute requires manual header on .NET 8
- Deployment mechanics: MEDIUM -- SmarterASP specifics need validation with actual deploy

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable stack, no fast-moving dependencies)
