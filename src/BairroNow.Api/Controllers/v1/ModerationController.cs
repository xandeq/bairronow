using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BairroNow.Api.Models.DTOs;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/admin/moderation")]
[Authorize(Policy = "Admin")]
public class ModerationController : ControllerBase
{
    private readonly IModerationService _moderation;

    public ModerationController(IModerationService moderation)
    {
        _moderation = moderation;
    }

    [HttpGet("reports")]
    public async Task<IActionResult> ListReports(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        [FromQuery] string? targetType = null,
        CancellationToken ct = default)
    {
        return Ok(await _moderation.ListPendingReportsAsync(skip, take, targetType, ct));
    }

    [HttpPost("reports/{id:int}/resolve")]
    public async Task<IActionResult> Resolve(int id, [FromBody] ResolveReportRequest body, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var ok = await _moderation.ResolveAsync(userId.Value, id, body, ct);
        return ok ? Ok(new { status = body.Action }) : NotFound();
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
