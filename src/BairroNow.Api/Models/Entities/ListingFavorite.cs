namespace BairroNow.Api.Models.Entities;

public class ListingFavorite
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public Listing? Listing { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    // SnapshotPrice supports MKT-009 price-change notification (Open Question 1)
    public decimal SnapshotPrice { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
