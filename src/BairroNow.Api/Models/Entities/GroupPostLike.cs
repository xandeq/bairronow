namespace BairroNow.Api.Models.Entities;

public class GroupPostLike
{
    public int Id { get; set; }
    public int GroupPostId { get; set; }
    public GroupPost? GroupPost { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
