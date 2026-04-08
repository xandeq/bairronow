using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Services;

public class RatingNotFoundException : Exception { public RatingNotFoundException() : base("Avaliação não encontrada.") {} }
public class RatingForbiddenException : Exception { public RatingForbiddenException(string m) : base(m) {} }
public class RatingValidationException : Exception { public RatingValidationException(string m) : base(m) {} }

public interface IRatingService
{
    Task<RatingDto> CreateAsync(Guid buyerId, Guid sellerId, CreateRatingRequest dto, CancellationToken ct = default);
    Task<RatingDto> EditAsync(Guid buyerId, Guid sellerId, int ratingId, CreateRatingRequest dto, CancellationToken ct = default);
    Task<SellerRatingsResponse> ListForSellerAsync(Guid sellerId, CancellationToken ct = default);
    Task AdminDeleteAsync(Guid adminId, int ratingId, CancellationToken ct = default);
}
