"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import {
  createPostSchema,
  type CreatePostInput,
} from "@bairronow/shared-validators";
import { feedClient } from "@/lib/feed";
import { useFeedStore } from "@/stores/feed-store";
import { useAuthStore } from "@/lib/auth";

interface PostComposerProps {
  open: boolean;
  onClose: () => void;
}

const MAX_IMAGES = 4;

export default function PostComposer({ open, onClose }: PostComposerProps) {
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.isVerified === true;
  const prependNew = useFeedStore((s) => s.prependNew);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { category: "Geral", body: "" },
  });

  const body = watch("body") ?? "";

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const slots = MAX_IMAGES - files.length;
      const toAdd = accepted.slice(0, slots);
      if (toAdd.length === 0) return;
      setCompressing(true);
      try {
        const compressed = await Promise.all(
          toAdd.map((f) =>
            imageCompression(f, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1600,
              useWebWorker: true,
            })
          )
        );
        setFiles((prev) => [...prev, ...compressed]);
        setPreviews((prev) => [
          ...prev,
          ...compressed.map((f) => URL.createObjectURL(f)),
        ]);
      } finally {
        setCompressing(false);
      }
    },
    [files.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: true,
    disabled: files.length >= MAX_IMAGES,
  });

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (data: CreatePostInput) => {
    if (!isVerified) {
      setServerError("Você precisa estar verificado para postar.");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const formData = new FormData();
      formData.append("category", data.category);
      formData.append("body", data.body);
      for (const f of files) formData.append("images", f, f.name);

      const post = await feedClient.createPost(formData);
      prependNew(post);
      reset();
      setFiles([]);
      setPreviews([]);
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erro ao publicar");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-extrabold text-fg mb-4">Novo post</h2>

        {!isVerified && (
          <p className="mb-3 text-sm font-semibold text-amber-700 bg-amber-50 p-3 rounded">
            Você precisa estar verificado para postar.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              Categoria
            </label>
            <select
              {...register("category")}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="Geral">Geral</option>
              <option value="Dica">Dica</option>
              <option value="Alerta">Alerta</option>
              <option value="Pergunta">Pergunta</option>
              <option value="Evento">Evento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              Mensagem
            </label>
            <textarea
              {...register("body")}
              rows={5}
              maxLength={2000}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              placeholder="O que está acontecendo no seu bairro?"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-red-600">{errors.body?.message}</span>
              <span className="text-fg/60">{body.length}/2000</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              Imagens (até {MAX_IMAGES})
            </label>
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center ${
                isDragActive
                  ? "border-green-700 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              } ${files.length >= MAX_IMAGES ? "opacity-50" : ""}`}
            >
              <input {...getInputProps()} />
              <p className="font-semibold text-fg/70">
                {compressing
                  ? "Comprimindo..."
                  : files.length >= MAX_IMAGES
                    ? "Máximo de imagens atingido"
                    : "Arraste imagens ou clique para selecionar"}
              </p>
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-bl px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 font-semibold">{serverError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border-2 border-gray-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !isVerified || compressing}
              className="bg-green-700 hover:bg-green-800 text-white rounded-md px-4 py-2 font-semibold disabled:opacity-50"
            >
              {submitting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
