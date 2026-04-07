using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NossoVizinho.Api.Services;

namespace NossoVizinho.Api.Controllers.v1;

[ApiController]
[Authorize]
public class VerificationController : ControllerBase
{
    private readonly IVerificationService _svc;

    public VerificationController(IVerificationService svc)
    {
        _svc = svc;
    }

    [HttpPost("/api/v1/verification")]
    [EnableRateLimiting("authenticated")]
    [RequestSizeLimit(6_291_456)]
    public async Task<IActionResult> Submit(
        [FromForm] string cep,
        [FromForm] string? numero,
        IFormFile proof,
        CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var status = await _svc.SubmitAsync(userId.Value, cep, numero, proof, ct);
            return Ok(status);
        }
        catch (CepNotFoundException)
        {
            return BadRequest(new { error = "CEP não encontrado." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("/api/v1/verification/me")]
    [EnableRateLimiting("authenticated")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return Ok(await _svc.GetMyStatusAsync(userId.Value, ct));
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
