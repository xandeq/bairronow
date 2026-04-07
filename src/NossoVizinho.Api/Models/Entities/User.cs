namespace NossoVizinho.Api.Models.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Bio { get; set; }
    public int? BairroId { get; set; }
    public Bairro? Bairro { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public bool IsAdmin { get; set; }
    public string? AcceptedTermsVersion { get; set; }
    public DateTime? AcceptedTermsAt { get; set; }
    public bool EmailConfirmed { get; set; }
    public string? EmailConfirmationToken { get; set; }
    public DateTime? EmailConfirmationTokenExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEnd { get; set; }
    public bool AcceptedPrivacyPolicy { get; set; }
    public int AcceptedPrivacyPolicyVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
