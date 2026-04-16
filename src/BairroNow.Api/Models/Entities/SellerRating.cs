namespace BairroNow.Api.Models.Entities;

public class SellerRating
{
    public int Id { get; set; }
    public Guid SellerId { get; set; }
    public User? Seller { get; set; }
    public Guid BuyerId { get; set; }
    public User? Buyer { get; set; }
    public int ListingId { get; set; }
    public Listing? Listing { get; set; }
    public int Stars { get; set; } // 1..5
    public string? Comment { get; set; } // max 500
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedByAdminAt { get; set; }
}
