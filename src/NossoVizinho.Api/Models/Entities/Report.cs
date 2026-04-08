using NossoVizinho.Api.Models.Enums;

namespace NossoVizinho.Api.Models.Entities;

public static class ReportStatus
{
    public const string Pending = "pending";
    public const string Resolved = "resolved";
    public const string Dismissed = "dismissed";
}

public static class ReportTargetTypes
{
    public const string Post = "post";
    public const string Comment = "comment";
    // Phase 4 (04-01): listing reports flow into the SAME Reports queue per D-21.
    public const string Listing = "listing";
}

public class Report
{
    public int Id { get; set; }
    public Guid ReporterId { get; set; }
    public User? Reporter { get; set; }
    public string TargetType { get; set; } = ReportTargetTypes.Post;
    public int TargetId { get; set; }
    public ReportReason Reason { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = ReportStatus.Pending;
    public Guid? ResolvedByUserId { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
