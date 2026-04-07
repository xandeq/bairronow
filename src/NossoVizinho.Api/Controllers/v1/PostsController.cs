using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Controllers.v1;

[ApiController]
[Route("api/v1/posts")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _posts;
    private readonly IFeedQueryService _feed;

    public PostsController(IPostService posts, IFeedQueryService feed)
    {
        _posts = posts;
        _feed = feed;
    }

    [HttpPost("")]
    [Authorize(Policy = "VerifiedOnly")]
    [EnableRateLimiting("feed-write")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> Create([FromForm] CreatePostRequest dto, IFormFileCollection? images, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            var post = await _posts.CreateAsync(userId.Value, dto, images, ct);
            return Ok(post);
        }
        catch (FeedForbiddenException ex) { return StatusCode(403, new { error = ex.Message }); }
        catch (FeedValidationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("")]
    public async Task<IActionResult> List([FromQuery] int bairroId, [FromQuery] string? cursor, [FromQuery] int take = 20, CancellationToken ct = default)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            var page = await _feed.GetBairroFeedAsync(userId.Value, bairroId, cursor, take, ct);
            return Ok(page);
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { error = ex.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var result = await _feed.GetPostAsync(userId.Value, id, ct);
        if (result == null) return NotFound();
        return Ok(new { post = result.Value.post, comments = result.Value.comments });
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "VerifiedOnly")]
    [EnableRateLimiting("feed-write")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePostRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            var post = await _posts.UpdateAsync(userId.Value, id, body.Body, ct);
            return Ok(post);
        }
        catch (FeedNotFoundException) { return NotFound(); }
        catch (FeedForbiddenException ex) { return StatusCode(403, new { error = ex.Message }); }
        catch (FeedValidationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            await _posts.DeleteAsync(userId.Value, id, ct);
            return NoContent();
        }
        catch (FeedNotFoundException) { return NotFound(); }
        catch (FeedForbiddenException ex) { return StatusCode(403, new { error = ex.Message }); }
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
