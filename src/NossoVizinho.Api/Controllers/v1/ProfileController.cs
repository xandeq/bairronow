using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Data;

namespace NossoVizinho.Api.Controllers.v1;

public class ProfileDto
{
    public string? DisplayName { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Bio { get; set; }
    public string? BairroNome { get; set; }
    public bool IsVerified { get; set; }
}

public class UpdateProfileRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string DisplayName { get; set; } = string.Empty;

    [StringLength(160)]
    public string Bio { get; set; } = string.Empty;
}

[ApiController]
[Authorize]
[EnableRateLimiting("authenticated")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("/api/v1/profile/me")]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.Bairro)
            .FirstOrDefaultAsync(u => u.Id == userId.Value, ct);

        if (user == null) return NotFound();

        return Ok(new ProfileDto
        {
            DisplayName = user.DisplayName,
            PhotoUrl = user.PhotoUrl,
            Bio = user.Bio,
            BairroNome = user.Bairro?.Nome,
            IsVerified = user.IsVerified
        });
    }

    [HttpPut("/api/v1/profile/me")]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user == null) return NotFound();

        user.DisplayName = req.DisplayName;
        user.Bio = string.IsNullOrWhiteSpace(req.Bio) ? null : req.Bio;
        await _db.SaveChangesAsync(ct);

        return Ok(new ProfileDto
        {
            DisplayName = user.DisplayName,
            PhotoUrl = user.PhotoUrl,
            Bio = user.Bio,
            IsVerified = user.IsVerified
        });
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
