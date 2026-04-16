namespace BairroNow.Api.Models.Entities;

public class GroupPostImage
{
    public int Id { get; set; }
    public int GroupPostId { get; set; }
    public GroupPost? GroupPost { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Order { get; set; }
}
