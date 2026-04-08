namespace NossoVizinho.Api.Models.DTOs;

public record AuthResponse(string AccessToken, UserInfo User);
public record UserInfo(
    Guid Id,
    string Email,
    string? DisplayName,
    bool EmailConfirmed,
    int? BairroId,
    bool IsVerified,
    bool IsAdmin);
