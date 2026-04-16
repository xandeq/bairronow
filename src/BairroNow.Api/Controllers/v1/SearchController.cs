using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly IFeedQueryService _feed;

    public SearchController(IFeedQueryService feed)
    {
        _feed = feed;
    }

    // Uses EF.Functions.Like (SQL LIKE) for body matching, scoped to caller bairro.
    [HttpGet("")]
    public async Task<IActionResult> Search([FromQuery] SearchRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var results = await _feed.SearchAsync(userId.Value, request, ct);
        return Ok(results);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
