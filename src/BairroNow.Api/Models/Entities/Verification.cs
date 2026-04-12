namespace BairroNow.Api.Models.Entities;

public static class VerificationStatus
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Rejected = "rejected";
}

public class Verification
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string Cep { get; set; } = string.Empty;
    public string Logradouro { get; set; } = string.Empty;
    public string? Numero { get; set; }

    public int? BairroId { get; set; }
    public Bairro? Bairro { get; set; }

    public string ProofFilePath { get; set; } = string.Empty;
    public string ProofSha256 { get; set; } = string.Empty;

    public string Status { get; set; } = VerificationStatus.Pending;

    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }

    public bool IsSuspectedDuplicate { get; set; }
    public bool IsDeleted { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime ReVerifyAfter { get; set; } = DateTime.UtcNow.AddMonths(12);
    public double? ApprovedLat { get; set; }
    public double? ApprovedLng { get; set; }

    // Phase 6: Document retention + OCR
    public DateTime? DocumentDeletedAt { get; set; }
    public string? OcrText { get; set; }
}
