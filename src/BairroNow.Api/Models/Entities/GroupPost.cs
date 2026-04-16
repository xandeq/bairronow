using BairroNow.Api.Models.Enums;

namespace BairroNow.Api.Models.Entities;

public class GroupPost
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }
    public PostCategory Category { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsFlagged { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<GroupPostImage> Images { get; set; } = new List<GroupPostImage>();
    public ICollection<GroupComment> Comments { get; set; } = new List<GroupComment>();
    public ICollection<GroupPostLike> Likes { get; set; } = new List<GroupPostLike>();
}
