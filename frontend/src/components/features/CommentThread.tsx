"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CommentDto } from "@bairronow/shared-types";
import {
  createCommentSchema,
  type CreateCommentInput,
} from "@bairronow/shared-validators";
import { feedClient } from "@/lib/feed";
import { useAuthStore } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";

interface CommentThreadProps {
  postId: number;
  initial: CommentDto[];
}

export default function CommentThread({ postId, initial }: CommentThreadProps) {
  const [comments, setComments] = useState<CommentDto[]>(initial);
  const user = useAuthStore((s) => s.user);

  const reload = async () => {
    const fresh = await feedClient.listComments(postId);
    setComments(fresh);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-extrabold text-fg">Comentários</h2>

      <CommentForm postId={postId} parentCommentId={null} onSent={reload} />

      {comments.length === 0 ? (
        <p className="text-sm text-muted-fg font-medium py-4 text-center">
          Nenhum comentário ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem
                comment={c}
                postId={postId}
                currentUserId={user?.id ?? null}
                onChanged={reload}
                isReply={false}
              />
              {c.replies.length > 0 && (
                <ul className="mt-2 ml-10 space-y-2 border-l-2 border-border/60 pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id}>
                      <CommentItem
                        comment={r}
                        postId={postId}
                        currentUserId={user?.id ?? null}
                        onChanged={reload}
                        isReply={true}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  onChanged,
  isReply,
}: {
  comment: CommentDto;
  postId: number;
  currentUserId: string | null;
  onChanged: () => void | Promise<void>;
  isReply: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOwner = currentUserId === comment.author.id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    locale: ptBR,
    addSuffix: true,
  });

  const handleEditSubmit = async () => {
    await feedClient.updateComment(comment.id, editBody);
    setEditing(false);
    await onChanged();
  };

  const handleDelete = async () => {
    await feedClient.deleteComment(comment.id);
    await onChanged();
  };

  return (
    <div className="flex gap-3">
      <Avatar
        name={comment.author.displayName ?? "Vizinho"}
        size="sm"
        className="shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-2xl px-3 py-2.5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-sm text-fg">
              {comment.author.displayName ?? "Vizinho"}
            </span>
            <span className="text-[11px] text-muted-fg">{timeAgo}</span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border/50 text-sm focus:bg-card focus:border-primary focus:outline-none transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-muted border border-border/50 hover:border-border-strong transition-colors text-fg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-fg whitespace-pre-wrap leading-relaxed">
              {comment.body}
            </p>
          )}
        </div>

        {/* Action row */}
        <div className="flex gap-4 mt-1.5 px-1 text-xs font-semibold text-muted-fg">
          {!isReply && (
            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              className="hover:text-primary transition-colors"
            >
              Responder
            </button>
          )}
          {isOwner && !editing && !confirmingDelete && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="hover:text-primary transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="hover:text-danger transition-colors"
              >
                Excluir
              </button>
            </>
          )}
          {confirmingDelete && (
            <>
              <span className="text-danger font-semibold">Excluir comentário?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="text-danger hover:underline"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="hover:text-fg transition-colors"
              >
                Não
              </button>
            </>
          )}
        </div>

        {replyOpen && !isReply && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              onSent={async () => {
                setReplyOpen(false);
                await onChanged();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CommentForm({
  postId,
  parentCommentId,
  onSent,
}: {
  postId: number;
  parentCommentId: number | null;
  onSent: () => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { postId, parentCommentId, body: "" },
  });

  const onSubmit = async (data: CreateCommentInput) => {
    await feedClient.createComment(data);
    reset({ postId, parentCommentId, body: "" });
    await onSent();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <input type="hidden" {...register("postId", { valueAsNumber: true })} />
      <input
        type="hidden"
        {...register("parentCommentId", {
          setValueAs: (v) =>
            v === null || v === "" || v === undefined ? null : Number(v),
        })}
      />
      <textarea
        {...register("body")}
        rows={2}
        maxLength={500}
        placeholder={parentCommentId ? "Responder..." : "Escreva um comentário..."}
        className="w-full px-3 py-2.5 rounded-xl bg-muted border-2 border-transparent text-sm text-fg placeholder:text-muted-fg focus:bg-card focus:border-primary focus:outline-none transition-colors resize-none"
      />
      {errors.body && (
        <p className="text-xs text-danger font-semibold">{errors.body.message}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover text-white text-sm rounded-xl px-4 py-1.5 font-semibold disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
