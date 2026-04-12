using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;

namespace BairroNow.Api.Services;

public class DigestSchedulerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<DigestSchedulerService> _logger;
    private DateOnly? _lastDigestDate;

    public DigestSchedulerService(IServiceProvider services, ILogger<DigestSchedulerService> logger)
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
                var now = DateTime.UtcNow;
                // Monday 12:00 UTC = 09:00 BRT
                if (now.DayOfWeek == DayOfWeek.Monday && now.Hour == 12 && now.Minute < 5)
                {
                    var today = DateOnly.FromDateTime(now);
                    if (_lastDigestDate != today)
                    {
                        _lastDigestDate = today;
                        await SendDigestsAsync(stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DigestSchedulerService error");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task SendDigestsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var users = await db.Users.AsNoTracking()
            .Where(u => !u.DigestOptOut && u.EmailConfirmed && u.IsActive && u.BairroId != null)
            .Select(u => new { u.Id, u.Email, u.BairroId })
            .ToListAsync(ct);

        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        var sevenDaysFromNow = DateTime.UtcNow.AddDays(7);

        foreach (var user in users)
        {
            try
            {
                var bairro = await db.Bairros.AsNoTracking()
                    .FirstOrDefaultAsync(b => b.Id == user.BairroId, ct);

                if (bairro == null) continue;

                var topPosts = await db.Posts.AsNoTracking()
                    .Where(p => p.BairroId == user.BairroId && p.CreatedAt >= sevenDaysAgo)
                    .OrderByDescending(p => p.Likes.Count)
                    .Take(3)
                    .Select(p => new { p.Id, p.Body, LikeCount = p.Likes.Count })
                    .ToListAsync(ct);

                var upcomingEvents = await db.GroupEvents.AsNoTracking()
                    .Where(e => e.Group!.BairroId == user.BairroId
                        && e.StartsAt >= DateTime.UtcNow
                        && e.StartsAt <= sevenDaysFromNow
                        && e.DeletedAt == null)
                    .OrderBy(e => e.StartsAt)
                    .Take(3)
                    .Select(e => new { e.Id, e.Title, e.StartsAt })
                    .ToListAsync(ct);

                if (!topPosts.Any() && !upcomingEvents.Any())
                    continue;

                var html = $@"
<h2>O que aconteceu no {bairro.Nome} essa semana</h2>";

                if (topPosts.Any())
                {
                    html += "<h3>Posts mais curtidos</h3><ul>";
                    foreach (var post in topPosts)
                    {
                        var preview = post.Body.Length > 100 ? post.Body[..100] + "..." : post.Body;
                        html += $"<li>{preview} ({post.LikeCount} curtidas)</li>";
                    }
                    html += "</ul>";
                }

                if (upcomingEvents.Any())
                {
                    html += "<h3>Proximos eventos</h3><ul>";
                    foreach (var ev in upcomingEvents)
                    {
                        html += $"<li><strong>{ev.Title}</strong> - {ev.StartsAt:dd/MM/yyyy HH:mm}</li>";
                    }
                    html += "</ul>";
                }

                await emailService.SendWeeklyDigestAsync(user.Email, bairro.Nome, html);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send digest to {UserId}", user.Id);
            }
        }

        _logger.LogInformation("Weekly digest sent to {Count} users", users.Count);
    }
}
