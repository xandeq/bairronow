using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Services;

public interface IModerationService
{
    Task<ReportDto> CreateReportAsync(Guid reporterId, CreateReportRequest dto, CancellationToken ct = default);
    Task<List<ReportDto>> ListPendingReportsAsync(int skip, int take, CancellationToken ct = default);
    // Phase 4 (04-01) D-21: shared queue with targetType filter (post|comment|listing)
    Task<List<ReportDto>> ListPendingReportsAsync(int skip, int take, string? targetType, CancellationToken ct = default);
    Task<bool> ResolveAsync(Guid adminId, int reportId, ResolveReportRequest action, CancellationToken ct = default);
}
