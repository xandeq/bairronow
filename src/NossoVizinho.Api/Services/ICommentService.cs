using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Services;

public interface ICommentService
{
    Task<CommentDto> CreateAsync(Guid authorId, CreateCommentRequest dto, CancellationToken ct = default);
    Task<CommentDto> UpdateAsync(Guid authorId, int commentId, string body, CancellationToken ct = default);
    Task DeleteAsync(Guid authorId, int commentId, CancellationToken ct = default);
    Task<List<CommentDto>> GetByPostAsync(int postId, CancellationToken ct = default);
}
