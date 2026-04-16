namespace BairroNow.Api.Models.Entities;

public class GroupEvent
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public DateTime? ReminderAt { get; set; }
    public bool ReminderSent { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<GroupEventRsvp> Rsvps { get; set; } = new List<GroupEventRsvp>();
}
