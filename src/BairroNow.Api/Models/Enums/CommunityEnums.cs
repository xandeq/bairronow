namespace BairroNow.Api.Models.Enums;

// ─── Wave P: Diretório de grupos de WhatsApp + Condomínios ──────────────────

// Tipo do grupo de WhatsApp catalogado no diretório.
public enum WhatsAppGroupKind { Predio, Condominio, Rua, Bairro, Comercio, Interesse }

// Estado de moderação de um grupo submetido ao diretório.
public enum WhatsAppGroupStatus { PendingReview, Verified, Rejected }

// Estado de posse de um condomínio (reivindicação pelo síndico).
public enum CondominiumStatus { Unclaimed, ClaimPending, Claimed }

// Papel reivindicado por quem assume o condomínio.
public enum CondominiumRole { Sindico, SubSindico, Administradora, Conselheiro }

// Estado de uma reivindicação de condomínio.
public enum CondominiumClaimStatus { Pending, Approved, Rejected }
