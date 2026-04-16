using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/posts/{postId:int}/like")]
[Authorize]
public class LikesController : ControllerBase
{
    private readonly ILikeService _likes;

    public LikesController(ILikeService likes)
    {
        _likes = likes;
    }

    [HttpPost("")]
    [Authorize(Policy = "VerifiedOnly")]
    [EnableRateLimiting("feed-write")]
    public async Task<IActionResult> Toggle(int postId, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            var result = await _likes.ToggleAsync(userId.Value, postId, ct);
            return Ok(result);
        }
        catch (FeedNotFoundException) { return NotFound(); }
    }

    [HttpGet("who")]
    public async Task<IActionResult> Who(int postId, CancellationToken ct)
    {
        return Ok(await _likes.WhoLikedAsync(postId, ct));
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
