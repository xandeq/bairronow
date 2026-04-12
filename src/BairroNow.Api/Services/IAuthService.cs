using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Services;

public interface IAuthService
{
    Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request, string ipAddress);
    Task<(AuthResponse? Response, string? RefreshToken, string? Error)> LoginAsync(LoginRequest request, string ipAddress);
    Task<(AuthResponse? Response, string? NewRefreshToken, string? Error)> RefreshAsync(string refreshToken, string ipAddress);
    Task LogoutAsync(string refreshToken, string ipAddress);
    Task LogoutAllAsync(Guid userId);
    Task<string?> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string email, string newPassword);

    // Phase 6: Google OAuth
    Task<(AuthResponse? Response, string? RefreshToken, string? Error)> GoogleSignInAsync(string email, string googleId);
    Task<(AuthResponse? Response, string? RefreshToken, string? Error)> GoogleSignInMobileAsync(string idToken);

    // Phase 6: Magic Link
    Task RequestMagicLinkAsync(string email);
    Task<(AuthResponse? Response, string? RefreshToken, string? Error)> VerifyMagicLinkAsync(string rawTokenBase64);

    // Phase 6: TOTP
    Task<(string Secret, string[] BackupCodes)?> SetupTotpAsync(Guid userId);
    Task<(AuthResponse? Response, string? RefreshToken, string? Error)> VerifyTotpAsync(string tempToken, string code);
}
