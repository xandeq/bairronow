using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Authorize]
[EnableRateLimiting("authenticated")]
public class BusinessesController : ControllerBase
{
    private readonly AppDbContext _db;
    public BusinessesController(AppDbContext db) => _db = db;

    // GET /api/v1/businesses
    [HttpGet("/api/v1/businesses")]
    [AllowAnonymous]
    [EnableRateLimiting("anonymous")]
    public async Task<IActionResult> List(
        [FromQuery] int? bairroId,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var usersQuery = _db.Users.AsNoTracking()
            .Include(u => u.Bairro)
            .Where(u => u.IsBusinessAccount && u.IsActive && u.BusinessName != null && u.BusinessName != "");

        if (bairroId.HasValue)
            usersQuery = usersQuery.Where(u => u.BairroId == bairroId.Value);

        if (!string.IsNullOrWhiteSpace(category))
            usersQuery = usersQuery.Where(u => u.BusinessCategory == category);

        var totalCount = await usersQuery.CountAsync(ct);
        Response.Headers["X-Total-Count"] = totalCount.ToString();

        // 1. Get the business users (no ratings join yet)
        var users = await usersQuery
            .OrderBy(u => u.BusinessName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new {
                u.Id, u.DisplayName, u.BusinessName, u.BusinessCategory,
                u.PhotoUrl, u.IsVerified,
                BairroNome = u.Bairro != null ? u.Bairro.Nome : null,
            })
            .ToListAsync(ct);

        if (users.Count == 0)
            return Ok(Array.Empty<object>());

        // 2. Get ratings aggregates for these users in one query
        var userIds = users.Select(u => u.Id).ToList();
        var ratings = await _db.BusinessRatings.AsNoTracking()
            .Where(r => userIds.Contains(r.BusinessUserId))
            .GroupBy(r => r.BusinessUserId)
            .Select(g => new { BusinessUserId = g.Key, Average = g.Average(r => (double)r.Stars), Total = g.Count() })
            .ToListAsync(ct);

        var ratingsMap = ratings.ToDictionary(r => r.BusinessUserId);

        // 3. Merge and sort by rating descending in memory
        var result = users
            .Select(u => new {
                userId = u.Id,
                u.DisplayName,
                u.BusinessName,
                u.BusinessCategory,
                u.PhotoUrl,
                u.IsVerified,
                u.BairroNome,
                RatingAverage = ratingsMap.TryGetValue(u.Id, out var r) ? (double?)r.Average : null,
                RatingTotal = ratingsMap.TryGetValue(u.Id, out var r2) ? r2.Total : 0,
            })
            .OrderByDescending(u => u.RatingAverage ?? -1)
            .ThenBy(u => u.BusinessName)
            .ToList();

        return Ok(result);
    }
}
