using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public class DocumentRetentionService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<DocumentRetentionService> _logger;
    private DateOnly? _lastRunDate;

    public DocumentRetentionService(IServiceProvider services, ILogger<DocumentRetentionService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                if (_lastRunDate != today)
                {
                    await CleanExpiredDocumentsAsync(stoppingToken);
                    // Mark day done AFTER success so transient failures retry on the
                    // next 1h tick rather than deferring LGPD 90d retention by a day.
                    _lastRunDate = today;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DocumentRetentionService error");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task CleanExpiredDocumentsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTime.UtcNow.AddDays(-90);

        var expiredDocs = await db.Verifications.IgnoreQueryFilters()
            .Where(v => v.Status == VerificationStatus.Approved
                && v.ReviewedAt != null
                && v.ReviewedAt < cutoff
                && v.DocumentDeletedAt == null
                && v.ProofFilePath != "")
            .ToListAsync(ct);

        var deleted = 0;
        foreach (var v in expiredDocs)
        {
            try
            {
                if (File.Exists(v.ProofFilePath))
                    File.Delete(v.ProofFilePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete expired document {Path}", v.ProofFilePath);
            }

            v.ProofFilePath = "";
            v.DocumentDeletedAt = DateTime.UtcNow;
            deleted++;
        }

        if (deleted > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Document retention: deleted {Count} expired proof documents", deleted);
        }
    }
}
