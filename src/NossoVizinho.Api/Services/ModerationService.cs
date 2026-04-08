using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Data;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Services;

public class ModerationService : IModerationService
{
    private readonly AppDbContext _db;
    private readonly IValidator<CreateReportRequest> _validator;

    public ModerationService(AppDbContext db, IValidator<CreateReportRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ReportDto> CreateReportAsync(Guid reporterId, CreateReportRequest dto, CancellationToken ct = default)
    {
        var validation = await _validator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            throw new FeedValidationException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var report = new Report
        {
            ReporterId = reporterId,
            TargetType = dto.TargetType,
            TargetId = dto.TargetId,
            Reason = dto.Reason,
            Note = dto.Note,
            Status = ReportStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _db.Reports.Add(report);
        await _db.SaveChangesAsync(ct);

        var reporter = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == reporterId, ct);
        return new ReportDto
        {
            Id = report.Id,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            Reason = report.Reason,
            Note = report.Note,
            ReporterEmail = reporter?.Email ?? string.Empty,
            CreatedAt = report.CreatedAt,
            Status = report.Status
        };
    }

    public Task<List<ReportDto>> ListPendingReportsAsync(int skip, int take, CancellationToken ct = default)
        => ListPendingReportsAsync(skip, take, null, ct);

    public async Task<List<ReportDto>> ListPendingReportsAsync(int skip, int take, string? targetType, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 100);
        var query = _db.Reports.AsNoTracking()
            .Include(r => r.Reporter)
            .Where(r => r.Status == ReportStatus.Pending);
        if (!string.IsNullOrWhiteSpace(targetType))
            query = query.Where(r => r.TargetType == targetType);

        var reports = await query
            .OrderBy(r => r.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(r => new ReportDto
            {
                Id = r.Id,
                TargetType = r.TargetType,
                TargetId = r.TargetId,
                Reason = r.Reason,
                Note = r.Note,
                ReporterEmail = r.Reporter!.Email,
                CreatedAt = r.CreatedAt,
                Status = r.Status
            })
            .ToListAsync(ct);
        return reports;
    }

    public async Task<bool> ResolveAsync(Guid adminId, int reportId, ResolveReportRequest action, CancellationToken ct = default)
    {
        var report = await _db.Reports.FirstOrDefaultAsync(r => r.Id == reportId, ct);
        if (report == null) return false;

        if (string.Equals(action.Action, "remove", StringComparison.OrdinalIgnoreCase))
        {
            if (report.TargetType == ReportTargetTypes.Post)
            {
                var post = await _db.Posts.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == report.TargetId, ct);
                if (post != null) post.DeletedAt = DateTime.UtcNow;
            }
            else if (report.TargetType == ReportTargetTypes.Comment)
            {
                var comment = await _db.Comments.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == report.TargetId, ct);
                if (comment != null) comment.DeletedAt = DateTime.UtcNow;
            }
            else if (report.TargetType == ReportTargetTypes.Listing)
            {
                // Phase 4 (04-01) D-21: shared moderation queue can soft-delete listings.
                var listing = await _db.Listings.IgnoreQueryFilters().FirstOrDefaultAsync(l => l.Id == report.TargetId, ct);
                if (listing != null)
                {
                    listing.DeletedAt = DateTime.UtcNow;
                    listing.Status = ListingStatus.Removed;
                }
            }
            report.Status = ReportStatus.Resolved;
        }
        else
        {
            report.Status = ReportStatus.Dismissed;
        }
        report.ResolvedByUserId = adminId;
        report.ResolvedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            Action = $"moderation.{action.Action}",
            EntityType = "Report",
            EntityId = report.Id.ToString(),
            UserId = adminId,
            IpAddress = "system",
            Details = action.Reason
        });

        await _db.SaveChangesAsync(ct);
        return true;
    }
}
