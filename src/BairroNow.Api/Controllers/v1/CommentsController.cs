using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/comments")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _comments;

    public CommentsController(ICommentService comments)
    {
        _comments = comments;
    }

    [HttpPost("")]
    [Authorize(Policy = "VerifiedOnly")]
    [EnableRateLimiting("feed-write")]
    public async Task<IActionResult> Create([FromBody] CreateCommentRequest dto, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            // ParentCommentId allows replies to root only
            var comment = await _comments.CreateAsync(userId.Value, dto, ct);
            return Ok(comment);
        }
        catch (FeedNotFoundException) { return NotFound(); }
        catch (FeedForbiddenException ex) { return StatusCode(403, new { error = ex.Message }); }
        catch (FeedValidationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "VerifiedOnly")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCommentRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            var c = await _comments.UpdateAsync(userId.Value, id, body.Body, ct);
            return Ok(c);
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
            await _comments.DeleteAsync(userId.Value, id, ct);
            return NoContent();
        }
        catch (FeedNotFoundException) { return NotFound(); }
        catch (FeedForbiddenException ex) { return StatusCode(403, new { error = ex.Message }); }
    }

    [HttpGet("by-post/{postId:int}")]
    public async Task<IActionResult> ByPost(int postId, CancellationToken ct)
    {
        var tree = await _comments.GetByPostAsync(postId, ct);
        return Ok(tree);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
