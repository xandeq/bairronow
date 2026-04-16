namespace BairroNow.Api.Models.Entities;

public class ListingPhoto
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public Listing? Listing { get; set; }
    public int OrderIndex { get; set; } // 0 = cover (D-01)
    public string StoragePath { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
