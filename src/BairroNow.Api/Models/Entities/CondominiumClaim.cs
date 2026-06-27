using BairroNow.Api.Models.Enums;

namespace BairroNow.Api.Models.Entities;

// Pedido de reivindicação de um condomínio. Um admin aprova e, ao aprovar,
// o condomínio passa a Claimed com SindicoUserId definido. O controle do
// WhatsApp permanece com a plataforma (controle humano da transferência).
public class CondominiumClaim
{
    public int Id { get; set; }
    public int CondominiumId { get; set; }
    public Condominium? Condominium { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public CondominiumRole RequestedRole { get; set; } = CondominiumRole.Sindico;
    public string Justification { get; set; } = string.Empty;
    public string? EvidenceUrl { get; set; }

    public CondominiumClaimStatus Status { get; set; } = CondominiumClaimStatus.Pending;
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
