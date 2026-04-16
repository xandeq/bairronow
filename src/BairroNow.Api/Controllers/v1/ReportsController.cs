using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IModerationService _moderation;

    public ReportsController(IModerationService moderation)
    {
        _moderation = moderation;
    }

    [HttpPost("")]
    [EnableRateLimiting("feed-write")]
    public async Task<IActionResult> Create([FromBody] CreateReportRequest dto, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try
        {
            var report = await _moderation.CreateReportAsync(userId.Value, dto, ct);
            return Ok(report);
        }
        catch (FeedValidationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
