using Microsoft.AspNetCore.Http;

namespace BairroNow.Api.Services;

public class VerificationStatusDto
{
    public string Status { get; set; } = "none";
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? BairroNome { get; set; }
}

public class AdminVerificationListItem
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string? BairroNome { get; set; }
    public string ProofUrl { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public bool IsSuspectedDuplicate { get; set; }
}

public interface IVerificationService
{
    Task<VerificationStatusDto> SubmitAsync(Guid userId, string cep, string? numero, IFormFile proof, CancellationToken ct = default);
    Task<VerificationStatusDto> GetMyStatusAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<AdminVerificationListItem>> ListPendingAsync(int skip, int take, CancellationToken ct = default);
    Task<bool> ApproveAsync(int verificationId, Guid adminUserId, CancellationToken ct = default);
    Task<bool> RejectAsync(int verificationId, Guid adminUserId, string reason, CancellationToken ct = default);
    Task<(Stream stream, string contentType)?> GetProofStreamAsync(int verificationId, CancellationToken ct = default);
}
