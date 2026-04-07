using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Services;

public interface IModerationService
{
    Task<ReportDto> CreateReportAsync(Guid reporterId, CreateReportRequest dto, CancellationToken ct = default);
    Task<List<ReportDto>> ListPendingReportsAsync(int skip, int take, CancellationToken ct = default);
    Task<bool> ResolveAsync(Guid adminId, int reportId, ResolveReportRequest action, CancellationToken ct = default);
}
