using BairroNow.Api.Models.Enums;

namespace BairroNow.Api.Models.Entities;

// Entrada do diretório de grupos de WhatsApp do bairro. O link só fica visível
// publicamente após verificação (Status == Verified). Diferencial central do
// Meu Vizinho frente a Nextdoor/WeUp.
public class WhatsAppGroup
{
    public int Id { get; set; }
    public int BairroId { get; set; }
    public Bairro? Bairro { get; set; }

    // Vínculo opcional a um condomínio.
    public int? CondominiumId { get; set; }
    public Condominium? Condominium { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Link de convite (https://chat.whatsapp.com/XXXXXXXX).
    public string InviteUrl { get; set; } = string.Empty;

    public WhatsAppGroupKind Kind { get; set; } = WhatsAppGroupKind.Bairro;
    public string? CoverImageUrl { get; set; }
    public int? MemberCountApprox { get; set; }

    public WhatsAppGroupStatus Status { get; set; } = WhatsAppGroupStatus.PendingReview;

    // True quando o número comercial @meuvizinho é admin permanente do grupo.
    public bool IsManagedByPlatform { get; set; }

    // Funil: cliques no link de convite.
    public int ClickCount { get; set; }

    public Guid? SubmittedByUserId { get; set; }
    public User? SubmittedByUser { get; set; }

    public Guid? VerifiedByUserId { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
