namespace BairroNow.Api.Models.Entities;

public class BusinessPhoto
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Url { get; set; } = "";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
