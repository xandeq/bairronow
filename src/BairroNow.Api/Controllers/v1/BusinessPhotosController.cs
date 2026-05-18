using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using BairroNow.Api.Data;
using BairroNow.Api.Models.Entities;
using BairroNow.Api.Services;

namespace BairroNow.Api.Controllers.v1;

[ApiController]
[Route("api/v1/users/{userId:guid}/business-photos")]
public class BusinessPhotosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _storage;

    public BusinessPhotosController(AppDbContext db, IFileStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    [HttpPost("")]
    [Authorize]
    [EnableRateLimiting("authenticated")]
    [RequestSizeLimit(5_242_880)]
    public async Task<IActionResult> Upload(Guid userId, IFormFile photo, CancellationToken ct)
    {
        var callerId = GetUserId();
        if (callerId == null) return Unauthorized();
        if (callerId.Value != userId) return Forbid();

        if (photo == null || photo.Length == 0)
            return BadRequest(new { error = "Arquivo inválido." });

        var count = await _db.BusinessPhotos.CountAsync(p => p.UserId == userId, ct);
        if (count >= 10)
            return BadRequest(new { error = "Limite de 10 fotos atingido." });

        string url;
        try
        {
            url = await _storage.SaveImageAsync(photo.OpenReadStream(), photo.FileName, photo.ContentType, "business", ct);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        var entity = new BusinessPhoto
        {
            UserId = userId,
            Url = url,
            DisplayOrder = count,
            CreatedAt = DateTime.UtcNow
        };
        _db.BusinessPhotos.Add(entity);
        await _db.SaveChangesAsync(ct);

        return StatusCode(201, new { id = entity.Id, url = entity.Url, displayOrder = entity.DisplayOrder });
    }

    [HttpGet("")]
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> List(Guid userId, CancellationToken ct)
    {
        var photos = await _db.BusinessPhotos
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new { id = p.Id, url = p.Url, displayOrder = p.DisplayOrder })
            .ToListAsync(ct);

        return Ok(photos);
    }

    [HttpDelete("{photoId:int}")]
    [Authorize]
    [EnableRateLimiting("authenticated")]
    public async Task<IActionResult> Delete(Guid userId, int photoId, CancellationToken ct)
    {
        var callerId = GetUserId();
        if (callerId == null) return Unauthorized();
        if (callerId.Value != userId) return Forbid();

        var photo = await _db.BusinessPhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.UserId == userId, ct);
        if (photo == null) return NotFound();

        _db.BusinessPhotos.Remove(photo);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
