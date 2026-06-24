// Wave P — Diretório de grupos de WhatsApp + Condomínios (diferencial Meu Vizinho).
// Espelha os DTOs de WhatsAppGroupsController / CondominiumsController.

export type WhatsAppGroupKind =
  | 'Predio'
  | 'Condominio'
  | 'Rua'
  | 'Bairro'
  | 'Comercio'
  | 'Interesse';

export type WhatsAppGroupStatus = 'PendingReview' | 'Verified' | 'Rejected';

export interface WhatsAppGroupSummary {
  id: number;
  name: string;
  description: string | null;
  kind: WhatsAppGroupKind;
  coverImageUrl: string | null;
  memberCountApprox: number | null;
  isManagedByPlatform: boolean;
  clickCount: number;
  condominiumId: number | null;
  condominiumName: string | null;
  createdAt: string;
}

export interface WhatsAppGroupDetail extends WhatsAppGroupSummary {
  bairroId: number;
  inviteUrl: string;
  status: WhatsAppGroupStatus;
  submittedByUserId: string | null;
  verifiedAt: string | null;
}

export type CondominiumStatus = 'Unclaimed' | 'ClaimPending' | 'Claimed';
export type CondominiumRole = 'Sindico' | 'SubSindico' | 'Administradora' | 'Conselheiro';

export interface CondominiumSummary {
  id: number;
  name: string;
  description: string | null;
  addressLine: string | null;
  cep: string | null;
  coverImageUrl: string | null;
  unitsCount: number | null;
  status: CondominiumStatus;
  sindicoName: string | null;
  groupCount: number;
  createdAt: string;
}

export interface CondominiumGroup {
  id: number;
  name: string;
  kind: WhatsAppGroupKind;
  memberCountApprox: number | null;
  isManagedByPlatform: boolean;
}

export interface CondominiumDetail {
  id: number;
  bairroId: number;
  name: string;
  description: string | null;
  addressLine: string | null;
  cep: string | null;
  coverImageUrl: string | null;
  unitsCount: number | null;
  status: CondominiumStatus;
  sindicoUserId: string | null;
  sindicoName: string | null;
  sindicoRole: CondominiumRole | null;
  isManagedByPlatform: boolean;
  createdAt: string;
  groups: CondominiumGroup[];
  myClaimStatus: string | null;
  isMySindico: boolean;
}

export const WHATSAPP_KIND_LABELS: Record<WhatsAppGroupKind, string> = {
  Predio: 'Prédio',
  Condominio: 'Condomínio',
  Rua: 'Rua',
  Bairro: 'Bairro',
  Comercio: 'Comércio',
  Interesse: 'Interesse',
};
