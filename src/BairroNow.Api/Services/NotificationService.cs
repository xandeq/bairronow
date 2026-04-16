using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Hubs;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext db, IHubContext<NotificationHub> hub, ILogger<NotificationService> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public Task NotifyCommentAsync(Guid recipientId, Guid actorId, int postId, int commentId, CancellationToken ct = default)
        => CreateAndPushAsync(NotificationTypes.Comment, recipientId, actorId, postId, commentId, ct);

    public Task NotifyReplyAsync(Guid recipientId, Guid actorId, int postId, int commentId, CancellationToken ct = default)
        => CreateAndPushAsync(NotificationTypes.Reply, recipientId, actorId, postId, commentId, ct);

    public Task NotifyLikeAsync(Guid recipientId, Guid actorId, int postId, CancellationToken ct = default)
        => CreateAndPushAsync(NotificationTypes.Like, recipientId, actorId, postId, null, ct);

    public Task NotifyMentionAsync(Guid recipientId, Guid actorId, int postId, int? commentId, CancellationToken ct = default)
        => CreateAndPushAsync(NotificationTypes.Mention, recipientId, actorId, postId, commentId, ct);

    private async Task CreateAndPushAsync(string type, Guid recipientId, Guid actorId, int? postId, int? commentId, CancellationToken ct)
    {
        if (recipientId == actorId) return;

        var notification = new Notification
        {
            UserId = recipientId,
            ActorUserId = actorId,
            Type = type,
            PostId = postId,
            CommentId = commentId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(ct);

        var actor = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId, ct);
        var dto = new NotificationDto
        {
            Id = notification.Id,
            Type = type,
            PostId = postId,
            CommentId = commentId,
            Actor = new PostAuthorDto
            {
                Id = actorId,
                DisplayName = actor?.DisplayName,
                PhotoUrl = actor?.PhotoUrl,
                IsVerified = actor?.IsVerified ?? false
            },
            IsRead = false,
            CreatedAt = notification.CreatedAt
        };

        try
        {
            await _hub.Clients.User(recipientId.ToString()).SendAsync("notification", dto, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push SignalR notification to {UserId}", recipientId);
        }
    }
}
