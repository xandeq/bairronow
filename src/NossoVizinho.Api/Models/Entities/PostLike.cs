namespace NossoVizinho.Api.Models.Entities;

public class PostLike
{
    public int PostId { get; set; }
    public Post? Post { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
