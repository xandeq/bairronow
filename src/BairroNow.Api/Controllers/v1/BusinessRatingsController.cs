using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;

namespace BairroNow.Api.Controllers.v1;

public class CreateBusinessRatingRequest
{
    [Range(1, 5)] public int Stars { get; set; }
    [StringLength(500)] public string? Comment { get; set; }
}

[ApiController]
[Authorize]
[EnableRateLimiting("authenticated")]
public class BusinessRatingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public BusinessRatingsController(AppDbContext db) => _db = db;

    // GET /api/v1/users/{businessUserId}/business-ratings
    [HttpGet("/api/v1/users/{businessUserId:guid}/business-ratings")]
    public async Task<IActionResult> List(Guid businessUserId, CancellationToken ct)
    {
        var ratings = await _db.BusinessRatings.AsNoTracking()
            .Include(r => r.Rater)
            .Where(r => r.BusinessUserId == businessUserId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .Select(r => new {
                r.Id, r.Stars, r.Comment, r.CreatedAt,
                Rater = new { r.Rater!.DisplayName, r.Rater.PhotoUrl, r.Rater.IsVerified }
            })
            .ToListAsync(ct);

        var avg = ratings.Count > 0 ? ratings.Average(r => r.Stars) : (double?)null;
        return Ok(new { ratings, average = avg, total = ratings.Count });
    }

    // POST /api/v1/users/{businessUserId}/business-ratings
    [HttpPost("/api/v1/users/{businessUserId:guid}/business-ratings")]
    public async Task<IActionResult> Upsert(Guid businessUserId, [FromBody] CreateBusinessRatingRequest req, CancellationToken ct)
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (!Guid.TryParse(sub, out var raterId)) return Unauthorized();
        if (raterId == businessUserId) return BadRequest(new { error = "Não pode avaliar seu próprio negócio." });

        var business = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == businessUserId && u.IsBusinessAccount, ct);
        if (business == null) return NotFound(new { error = "Negócio não encontrado." });

        var existing = await _db.BusinessRatings
            .FirstOrDefaultAsync(r => r.RaterId == raterId && r.BusinessUserId == businessUserId, ct);

        if (existing != null)
        {
            existing.Stars = req.Stars;
            existing.Comment = req.Comment;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.BusinessRatings.Add(new BusinessRating {
                RaterId = raterId, BusinessUserId = businessUserId,
                Stars = req.Stars, Comment = req.Comment, CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { saved = true });
    }
}
