namespace BairroNow.Api.Models.Entities;

public class BusinessRating
{
    public int Id { get; set; }
    public Guid RaterId { get; set; }
    public User? Rater { get; set; }
    public Guid BusinessUserId { get; set; }
    public User? BusinessUser { get; set; }
    public int Stars { get; set; } // 1-5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
