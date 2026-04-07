using NossoVizinho.Api.Models.Enums;

namespace NossoVizinho.Api.Models.Entities;

public class Post
{
    public int Id { get; set; }
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }
    public int BairroId { get; set; }
    public Bairro? Bairro { get; set; }
    public PostCategory Category { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsFlagged { get; set; }
    public bool IsPublished { get; set; } = true;
    public bool RestrictedToVerified { get; set; }
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PostImage> Images { get; set; } = new List<PostImage>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
}
