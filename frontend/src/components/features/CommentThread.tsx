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

      <CommentForm
        postId={postId}
        parentCommentId={null}
        onSent={reload}
      />

      {comments.length === 0 ? (
        <p className="text-fg/60 font-medium">Nenhum comentário ainda.</p>
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
                <ul className="mt-2 ml-8 space-y-2 border-l-2 border-border pl-4">
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
    if (!confirm("Excluir comentário?")) return;
    await feedClient.deleteComment(comment.id);
    await onChanged();
  };

  return (
    <div className="bg-muted rounded-md p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-sm text-fg">
          {comment.author.displayName ?? "Vizinho"}
        </span>
        <span className="text-xs text-fg/60">{timeAgo}</span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            maxLength={500}
            rows={2}
            className="border border-border rounded-md px-2 py-1 w-full text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEditSubmit}
              className="bg-green-700 text-white text-xs font-semibold rounded px-2 py-1"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-semibold rounded px-2 py-1 border"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-fg whitespace-pre-wrap">{comment.body}</p>
      )}

      <div className="flex gap-3 mt-2 text-xs font-semibold text-fg/60">
        {!isReply && (
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            className="hover:text-green-700"
          >
            Responder
          </button>
        )}
        {isOwner && !editing && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="hover:text-green-700"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="hover:text-red-600"
            >
              Excluir
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
        className="border border-border rounded-md px-3 py-2 w-full text-sm"
      />
      {errors.body && (
        <p className="text-xs text-red-600 font-semibold">
          {errors.body.message}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-700 hover:bg-green-800 text-white text-sm rounded-md px-3 py-1.5 font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
