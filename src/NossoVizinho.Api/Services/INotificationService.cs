namespace NossoVizinho.Api.Services;

public interface INotificationService
{
    Task NotifyCommentAsync(Guid recipientId, Guid actorId, int postId, int commentId, CancellationToken ct = default);
    Task NotifyReplyAsync(Guid recipientId, Guid actorId, int postId, int commentId, CancellationToken ct = default);
    Task NotifyLikeAsync(Guid recipientId, Guid actorId, int postId, CancellationToken ct = default);
    Task NotifyMentionAsync(Guid recipientId, Guid actorId, int postId, int? commentId, CancellationToken ct = default);
}
