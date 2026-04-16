using BairroNow.Api.Models.Enums;

namespace BairroNow.Api.Models.Entities;

public class GroupMember
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
    public GroupMemberStatus Status { get; set; } = GroupMemberStatus.Active;
    public GroupNotificationPreference NotificationPreference { get; set; } = GroupNotificationPreference.All;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
