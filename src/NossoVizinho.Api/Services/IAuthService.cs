using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Services;

public interface IAuthService
{
    Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request, string ipAddress);
    Task<(AuthResponse? Response, string? RefreshToken, string? Error)> LoginAsync(LoginRequest request, string ipAddress);
    Task<(AuthResponse? Response, string? NewRefreshToken, string? Error)> RefreshAsync(string refreshToken, string ipAddress);
    Task LogoutAsync(string refreshToken, string ipAddress);
    Task LogoutAllAsync(Guid userId);
    Task<string?> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string email, string newPassword);
}
