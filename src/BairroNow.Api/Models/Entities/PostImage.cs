namespace BairroNow.Api.Models.Entities;

public class PostImage
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public Post? Post { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Order { get; set; }
}
