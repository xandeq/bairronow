using BairroNow.Api.Models.Enums;

namespace BairroNow.Api.Models.Entities;

public class Group
{
    public int Id { get; set; }
    public int BairroId { get; set; }
    public Bairro? Bairro { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public GroupCategory Category { get; set; }
    public GroupJoinPolicy JoinPolicy { get; set; } = GroupJoinPolicy.Open;
    public GroupScope Scope { get; set; } = GroupScope.Bairro;
    public string? Rules { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<GroupPost> Posts { get; set; } = new List<GroupPost>();
    public ICollection<GroupEvent> Events { get; set; } = new List<GroupEvent>();
}
