using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NossoVizinho.Api.Data;
using NossoVizinho.Api.Models.DTOs;
using NossoVizinho.Api.Models.Entities;

namespace NossoVizinho.Api.Services;

public class RatingService : IRatingService
{
    private static readonly TimeSpan EditWindow = TimeSpan.FromDays(7); // D-23

    private readonly AppDbContext _db;
    private readonly IValidator<CreateRatingRequest> _validator;

    public RatingService(AppDbContext db, IValidator<CreateRatingRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<RatingDto> CreateAsync(Guid buyerId, Guid sellerId, CreateRatingRequest dto, CancellationToken ct = default)
    {
        var validation = await _validator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            throw new RatingValidationException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == dto.ListingId, ct)
            ?? throw new RatingValidationException("Anúncio não encontrado.");
        if (listing.SellerId != sellerId)
            throw new RatingValidationException("Anúncio não pertence ao vendedor informado.");
        if (listing.Status != ListingStatus.Sold)
            throw new RatingValidationException("Apenas transações concluídas podem ser avaliadas.");
        if (buyerId == sellerId)
            throw new RatingForbiddenException("Vendedor não pode auto-avaliar.");

        var existing = await _db.SellerRatings
            .FirstOrDefaultAsync(r => r.BuyerId == buyerId && r.ListingId == dto.ListingId, ct);
        if (existing != null) throw new RatingValidationException("Você já avaliou este anúncio.");

        var rating = new SellerRating
        {
            SellerId = sellerId,
            BuyerId = buyerId,
            ListingId = dto.ListingId,
            Stars = dto.Stars,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.SellerRatings.Add(rating);
        await _db.SaveChangesAsync(ct);
        return MapDto(rating, null);
    }

    public async Task<RatingDto> EditAsync(Guid buyerId, Guid sellerId, int ratingId, CreateRatingRequest dto, CancellationToken ct = default)
    {
        var rating = await _db.SellerRatings.FirstOrDefaultAsync(r => r.Id == ratingId, ct)
            ?? throw new RatingNotFoundException();
        if (rating.BuyerId != buyerId) throw new RatingForbiddenException("Apenas o autor pode editar.");
        if (rating.SellerId != sellerId) throw new RatingValidationException("Vendedor não corresponde.");
        if (DateTime.UtcNow - rating.CreatedAt > EditWindow)
            throw new RatingForbiddenException("Janela de edição de 7 dias expirou.");

        var validation = await _validator.ValidateAsync(dto, ct);
        if (!validation.IsValid)
            throw new RatingValidationException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

        rating.Stars = dto.Stars;
        rating.Comment = dto.Comment;
        rating.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return MapDto(rating, null);
    }

    public async Task<SellerRatingsResponse> ListForSellerAsync(Guid sellerId, CancellationToken ct = default)
    {
        var rows = await _db.SellerRatings.AsNoTracking()
            .Include(r => r.Buyer)
            .Where(r => r.SellerId == sellerId && r.DeletedByAdminAt == null)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
        return new SellerRatingsResponse
        {
            SellerId = sellerId,
            Count = rows.Count,
            Average = rows.Count == 0 ? 0 : Math.Round(rows.Average(r => r.Stars), 2),
            Ratings = rows.Select(r => MapDto(r, r.Buyer?.DisplayName)).ToList()
        };
    }

    public async Task AdminDeleteAsync(Guid adminId, int ratingId, CancellationToken ct = default)
    {
        var rating = await _db.SellerRatings.FirstOrDefaultAsync(r => r.Id == ratingId, ct)
            ?? throw new RatingNotFoundException();
        rating.DeletedByAdminAt = DateTime.UtcNow;
        _db.AuditLogs.Add(new AuditLog
        {
            Action = "rating.admin-delete",
            EntityType = "SellerRating",
            EntityId = ratingId.ToString(),
            UserId = adminId,
            IpAddress = "system"
        });
        await _db.SaveChangesAsync(ct);
    }

    private static RatingDto MapDto(SellerRating r, string? buyerDisplayName) => new()
    {
        Id = r.Id,
        SellerId = r.SellerId,
        BuyerId = r.BuyerId,
        BuyerDisplayName = buyerDisplayName,
        ListingId = r.ListingId,
        Stars = r.Stars,
        Comment = r.Comment,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
    };
}
