using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Services;

public interface ILikeService
{
    Task<LikeToggleResult> ToggleAsync(Guid userId, int postId, CancellationToken ct = default);
    Task<List<PostAuthorDto>> WhoLikedAsync(int postId, CancellationToken ct = default);
}
