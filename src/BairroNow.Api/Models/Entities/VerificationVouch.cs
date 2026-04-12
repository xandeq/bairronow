namespace BairroNow.Api.Models.Entities;

public class VerificationVouch
{
    public int Id { get; set; }
    public Guid VoucheeId { get; set; }
    public User? Vouchee { get; set; }
    public Guid VoucherId { get; set; }
    public User? Voucher { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
