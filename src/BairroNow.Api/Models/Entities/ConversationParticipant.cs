namespace BairroNow.Api.Models.Entities;

public class ConversationParticipant
{
    public int ConversationId { get; set; }
    public Conversation? Conversation { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public DateTime? LastReadAt { get; set; }
    public bool SoftDeleted { get; set; }
}
