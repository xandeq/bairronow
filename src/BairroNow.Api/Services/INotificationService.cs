namespace BairroNow.Api.Services;

public interface INotificationService
{
    Task NotifyCommentAsync(Guid recipientId, Guid actorId, int postId, int commentId, CancellationToken ct = default);
    Task NotifyReplyAsync(Guid recipientId, Guid actorId, int postId, int commentId, CancellationToken ct = default);
    Task NotifyLikeAsync(Guid recipientId, Guid actorId, int postId, CancellationToken ct = default);
    Task NotifyMentionAsync(Guid recipientId, Guid actorId, int postId, int? commentId, CancellationToken ct = default);

    // Wave I notifications
    Task NotifyGroupJoinApprovedAsync(Guid recipientId, string groupName, int groupId, CancellationToken ct = default);
    Task NotifyNewRatingAsync(Guid businessOwnerId, string raterName, int stars, CancellationToken ct = default);
    Task NotifyGroupEventCreatedAsync(int groupId, Guid creatorId, string eventTitle, int eventId, CancellationToken ct = default);
}
