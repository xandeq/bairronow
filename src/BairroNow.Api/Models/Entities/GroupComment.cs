namespace BairroNow.Api.Models.Entities;

public class GroupComment
{
    public int Id { get; set; }
    public int GroupPostId { get; set; }
    public GroupPost? GroupPost { get; set; }
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }
    public int? ParentCommentId { get; set; }
    public GroupComment? ParentComment { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
