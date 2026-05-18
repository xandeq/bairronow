using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/feed")]
[Authorize]
[EnableRateLimiting("authenticated")]
public class FeedController : ControllerBase
{
    private readonly IFeedQueryService _feed;

    public FeedController(IFeedQueryService feed)
    {
        _feed = feed;
    }

    // GET /api/v1/feed/trending
    // Returns top 10 posts from the last 7 days in the caller's bairro,
    // scored by (likeCount * 2) + (commentCount * 3), descending.
    [HttpGet("trending")]
    public async Task<IActionResult> Trending(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var posts = await _feed.GetTrendingAsync(userId.Value, ct);
        return Ok(posts);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
