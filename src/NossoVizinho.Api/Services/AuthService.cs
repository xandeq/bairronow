using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Data;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const int RefreshTokenDays = 7;
    private const int PasswordResetHours = 1;

    public AuthService(AppDbContext db, ITokenService tokenService, IEmailService emailService, ILogger<AuthService> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request, string ipAddress)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email.ToLowerInvariant()))
            return (null, "E-mail ja cadastrado.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            EmailConfirmed = false,
            EmailConfirmationToken = Guid.NewGuid().ToString(),
            EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24),
            AcceptedPrivacyPolicy = true,
            AcceptedPrivacyPolicyVersion = 1
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _emailService.SendConfirmationEmailAsync(user.Email, user.EmailConfirmationToken);

        var accessToken = _tokenService.GenerateAccessToken(user);
        var response = new AuthResponse(accessToken, new UserInfo(user.Id, user.Email, user.DisplayName, user.EmailConfirmed, user.BairroId, user.IsVerified, user.IsAdmin));
        return (response, null);
    }

    public async Task<(AuthResponse? Response, string? RefreshToken, string? Error)> LoginAsync(LoginRequest request, string ipAddress)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());
        if (user == null)
            return (null, null, "E-mail ou senha incorretos.");

        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            return (null, null, "Conta bloqueada temporariamente. Tente novamente em 15 minutos.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                _logger.LogWarning("Account locked for {Email} after {Attempts} failed attempts", user.Email, user.FailedLoginAttempts);
            }
            await _db.SaveChangesAsync();
            return (null, null, "E-mail ou senha incorretos.");
        }

        // Success: reset failed attempts
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;

        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = HashToken(rawRefreshToken),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
            CreatedByIp = ipAddress
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        var response = new AuthResponse(accessToken, new UserInfo(user.Id, user.Email, user.DisplayName, user.EmailConfirmed, user.BairroId, user.IsVerified, user.IsAdmin));
        return (response, rawRefreshToken, null);
    }

    public async Task<(AuthResponse? Response, string? NewRefreshToken, string? Error)> RefreshAsync(string refreshToken, string ipAddress)
    {
        var tokenHash = HashToken(refreshToken);
        var storedToken = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == tokenHash);

        if (storedToken == null)
            return (null, null, "Token invalido.");

        if (storedToken.IsRevoked)
        {
            // Token reuse detected: revoke all tokens for this user
            var allTokens = await _db.RefreshTokens
                .Where(t => t.UserId == storedToken.UserId && !t.IsRevoked)
                .ToListAsync();
            foreach (var t in allTokens)
            {
                t.IsRevoked = true;
                t.RevokedByIp = ipAddress;
            }
            await _db.SaveChangesAsync();
            _logger.LogWarning("Refresh token reuse detected for user {UserId}", storedToken.UserId);
            return (null, null, "Token invalido.");
        }

        if (storedToken.ExpiresAt < DateTime.UtcNow)
            return (null, null, "Token expirado.");

        // Revoke old token
        storedToken.IsRevoked = true;
        storedToken.RevokedByIp = ipAddress;

        // Create new token
        var rawNewToken = _tokenService.GenerateRefreshToken();
        var newToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = HashToken(rawNewToken),
            UserId = storedToken.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
            CreatedByIp = ipAddress
        };
        storedToken.ReplacedByTokenId = newToken.Id;

        _db.RefreshTokens.Add(newToken);
        await _db.SaveChangesAsync();

        var user = storedToken.User;
        var accessToken = _tokenService.GenerateAccessToken(user);
        var response = new AuthResponse(accessToken, new UserInfo(user.Id, user.Email, user.DisplayName, user.EmailConfirmed, user.BairroId, user.IsVerified, user.IsAdmin));
        return (response, rawNewToken, null);
    }

    public async Task LogoutAsync(string refreshToken, string ipAddress)
    {
        var tokenHash = HashToken(refreshToken);
        var storedToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == tokenHash);
        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            storedToken.RevokedByIp = ipAddress;
            await _db.SaveChangesAsync();
        }
    }

    public async Task LogoutAllAsync(Guid userId)
    {
        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
            token.IsRevoked = true;

        await _db.SaveChangesAsync();
    }

    public async Task<string?> ForgotPasswordAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());
        if (user == null)
            return null; // Don't reveal if email exists

        user.PasswordResetToken = Guid.NewGuid().ToString();
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(PasswordResetHours);
        await _db.SaveChangesAsync();

        await _emailService.SendPasswordResetEmailAsync(user.Email, user.PasswordResetToken);
        return user.PasswordResetToken;
    }

    public async Task<bool> ResetPasswordAsync(string token, string email, string newPassword)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());
        if (user == null)
            return false;

        if (user.PasswordResetToken != token || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _db.SaveChangesAsync();

        return true;
    }

    private static string HashToken(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
