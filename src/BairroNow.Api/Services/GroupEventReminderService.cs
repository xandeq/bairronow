using BairroNow.Api.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Hubs;

namespace BairroNow.Api.Services;

public class GroupEventReminderService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<GroupEventReminderService> _logger;

    public GroupEventReminderService(IServiceProvider services, ILogger<GroupEventReminderService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await SendPendingReminders(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "GroupEventReminderService error"); }
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task SendPendingReminders(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hub = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

        var due = await db.GroupEvents
            .Where(e => e.ReminderAt <= DateTime.UtcNow && !e.ReminderSent && e.DeletedAt == null)
            .Include(e => e.Group)
            .ToListAsync(ct);

        foreach (var ev in due)
        {
            await hub.Clients.Group($"group:{ev.GroupId}")
                .SendAsync("GroupEventReminder", new { ev.Id, ev.Title, ev.StartsAt }, ct);
            ev.ReminderSent = true;
        }
        await db.SaveChangesAsync(ct);
    }
}
