namespace NossoVizinho.Api.Models.Entities;

public class Message
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public Conversation? Conversation { get; set; }
    public Guid SenderId { get; set; }
    public User? Sender { get; set; }
    public string? Text { get; set; }
    public string? ImagePath { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
