using Microsoft.AspNetCore.Http;
using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Services;

public interface IPostService
{
    Task<PostDto> CreateAsync(Guid authorId, CreatePostRequest dto, IFormFileCollection? images, CancellationToken ct = default);
    Task<PostDto> UpdateAsync(Guid authorId, int postId, string body, CancellationToken ct = default);
    Task DeleteAsync(Guid authorId, int postId, CancellationToken ct = default);
}

public class FeedForbiddenException : Exception
{
    public FeedForbiddenException(string message) : base(message) { }
}

public class FeedNotFoundException : Exception
{
    public FeedNotFoundException(string message) : base(message) { }
}

public class FeedValidationException : Exception
{
    public FeedValidationException(string message) : base(message) { }
}
