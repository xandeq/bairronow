using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Services;

public interface IFeedQueryService
{
    Task<FeedPageDto> GetBairroFeedAsync(Guid callerId, int bairroId, string? cursor, int take, CancellationToken ct = default);
    Task<(PostDto post, List<CommentDto> comments)?> GetPostAsync(Guid callerId, int postId, CancellationToken ct = default);
    Task<List<PostDto>> SearchAsync(Guid callerId, SearchRequest request, CancellationToken ct = default);
}
