namespace BairroNow.Api.Models.Entities;

public class RefreshToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public bool IsRevoked { get; set; }
    public string? RevokedByIp { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
}
