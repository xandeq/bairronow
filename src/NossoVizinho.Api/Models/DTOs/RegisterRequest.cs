namespace NossoVizinho.Api.Models.DTOs;

public record RegisterRequest(string Email, string Password, string ConfirmPassword, bool AcceptedPrivacyPolicy);
