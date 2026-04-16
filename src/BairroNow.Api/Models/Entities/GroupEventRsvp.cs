namespace BairroNow.Api.Models.Entities;

public class GroupEventRsvp
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public GroupEvent? Event { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public bool IsAttending { get; set; }
    public DateTime RespondedAt { get; set; } = DateTime.UtcNow;
}
