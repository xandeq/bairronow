// Feed module shared types — generated for Phase 03-01.
// Mirrors NossoVizinho.Api.Models.DTOs.* and Enums.

export type PostCategory = "Dica" | "Alerta" | "Pergunta" | "Evento" | "Geral";
export type ReportReason =
  | "Spam"
  | "Offensive"
  | "Discrimination"
  | "Misinformation"
  | "Other";
export type ReportTargetType = "post" | "comment";
export type NotificationType = "comment" | "reply" | "like" | "mention";

export interface PostImageDto {
  url: string;
  order: number;
}

export interface PostAuthorDto {
  id: string;
  displayName: string | null;
  photoUrl: string | null;
  isVerified: boolean;
}

export interface PostDto {
  id: number;
  author: PostAuthorDto;
  bairroId: number;
  category: PostCategory;
  body: string;
  images: PostImageDto[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  isEdited: boolean;
  createdAt: string;
  editedAt: string | null;
}

export interface CreatePostRequest {
  category: PostCategory;
  body: string;
}

export interface FeedPageDto {
  items: PostDto[];
  nextCursor: string | null;
}

export interface CommentDto {
  id: number;
  postId: number;
  parentCommentId: number | null;
  author: PostAuthorDto;
  body: string;
  createdAt: string;
  editedAt: string | null;
  replies: CommentDto[];
}

export interface CreateCommentRequest {
  postId: number;
  parentCommentId: number | null;
  body: string;
}

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  note: string | null;
}

export interface ReportDto {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  note: string | null;
  reporterEmail: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

export interface NotificationDto {
  id: number;
  type: NotificationType;
  postId: number | null;
  commentId: number | null;
  actor: PostAuthorDto;
  isRead: boolean;
  createdAt: string;
}

export interface SearchRequest {
  q: string;
  category?: PostCategory;
  from?: string;
  to?: string;
  authorId?: string;
  skip?: number;
  take?: number;
}

export interface LikeToggleResult {
  liked: boolean;
  count: number;
}
