using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (response, error) = await _authService.RegisterAsync(request, GetIpAddress());
        if (error != null)
            return Conflict(new { error });

        return StatusCode(201, new { message = "Conta criada. Verifique seu e-mail para confirmar." });
    }

    [HttpPost("login")]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (response, refreshToken, error) = await _authService.LoginAsync(request, GetIpAddress());
        if (error != null)
        {
            if (error.Contains("bloqueada"))
                return StatusCode(429, new { error });
            return Unauthorized(new { error = "E-mail ou senha incorretos." });
        }

        SetRefreshTokenCookie(refreshToken!);
        return Ok(response);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("authenticated")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { error = "Token nao encontrado." });

        var (response, newRefreshToken, error) = await _authService.RefreshAsync(refreshToken, GetIpAddress());
        if (error != null)
        {
            ClearRefreshTokenCookie();
            return Unauthorized(new { error });
        }

        SetRefreshTokenCookie(newRefreshToken!);
        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    [EnableRateLimiting("authenticated")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
            await _authService.LogoutAsync(refreshToken, GetIpAddress());

        ClearRefreshTokenCookie();
        return Ok(new { message = "Sessao encerrada." });
    }

    [HttpPost("logout-all")]
    [Authorize]
    [EnableRateLimiting("authenticated")]
    public async Task<IActionResult> LogoutAll()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Usuario nao identificado." });

        await _authService.LogoutAllAsync(userId);
        ClearRefreshTokenCookie();
        return Ok(new { message = "Todas as sessoes encerradas." });
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request.Email);
        return Ok(new { message = "Se o e-mail existir, enviaremos um link de recuperacao." });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request.Token, request.Email, request.NewPassword);
        if (!result)
            return BadRequest(new { error = "Token invalido ou expirado." });

        return Ok(new { message = "Senha alterada com sucesso." });
    }

    private void SetRefreshTokenCookie(string token)
    {
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTime.UtcNow.AddDays(7),
            Path = "/api/v1/auth"
        });
        // .NET 8 Partitioned attribute workaround
        var setCookie = Response.Headers["Set-Cookie"].ToString();
        if (setCookie.Contains("SameSite=None") && !setCookie.Contains("Partitioned"))
        {
            Response.Headers["Set-Cookie"] = setCookie.Replace("SameSite=None", "SameSite=None; Partitioned");
        }
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/api/v1/auth"
        });
    }

    private string GetIpAddress() =>
        HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "unknown";
}
