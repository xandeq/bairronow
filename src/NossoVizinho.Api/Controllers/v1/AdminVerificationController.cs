using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Controllers.v1;

public class RejectRequest
{
    public string Reason { get; set; } = string.Empty;
}

[ApiController]
[Authorize(Policy = "Admin")]
[EnableRateLimiting("authenticated")]
public class AdminVerificationController : ControllerBase
{
    private readonly IVerificationService _svc;

    public AdminVerificationController(IVerificationService svc)
    {
        _svc = svc;
    }

    [HttpGet("/api/v1/admin/verifications")]
    public async Task<IActionResult> List([FromQuery] string status = "pending", [FromQuery] int skip = 0, [FromQuery] int take = 20, CancellationToken ct = default)
    {
        if (!string.Equals(status, "pending", StringComparison.OrdinalIgnoreCase))
            return Ok(Array.Empty<AdminVerificationListItem>());
        var list = await _svc.ListPendingAsync(skip, take, ct);
        return Ok(list);
    }

    [HttpPost("/api/v1/admin/verifications/{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var adminId = GetUserId();
        if (adminId == null) return Unauthorized();
        var ok = await _svc.ApproveAsync(id, adminId.Value, ct);
        return ok ? Ok(new { status = "approved" }) : NotFound();
    }

    [HttpPost("/api/v1/admin/verifications/{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectRequest body, CancellationToken ct)
    {
        var adminId = GetUserId();
        if (adminId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(body.Reason))
            return BadRequest(new { error = "Motivo obrigatório." });
        var ok = await _svc.RejectAsync(id, adminId.Value, body.Reason, ct);
        return ok ? Ok(new { status = "rejected" }) : NotFound();
    }

    [HttpGet("/api/v1/admin/verifications/{id:int}/proof")]
    public async Task<IActionResult> Proof(int id, CancellationToken ct)
    {
        var result = await _svc.GetProofStreamAsync(id, ct);
        if (result == null) return NotFound();
        return File(result.Value.stream, result.Value.contentType);
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
