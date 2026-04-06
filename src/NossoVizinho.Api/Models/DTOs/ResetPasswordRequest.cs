namespace NossoVizinho.Api.Models.DTOs;

public record ResetPasswordRequest(string Token, string Email, string NewPassword);
