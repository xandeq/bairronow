namespace BairroNow.Api.Models.Entities;

public class Comment
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public Post? Post { get; set; }
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }
    public int? ParentCommentId { get; set; }
    public Comment? ParentComment { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}
