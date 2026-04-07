"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  searchSchema,
  type SearchInput,
} from "@bairronow/shared-validators";
import type { PostDto } from "@bairronow/shared-types";
import FeedHeader from "@/components/layouts/FeedHeader";
import PostCard from "@/components/features/PostCard";
import { feedClient } from "@/lib/feed";

export default function SearchPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
  });

  const [results, setResults] = useState<PostDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: SearchInput) => {
    setError(null);
    try {
      const res = await feedClient.search(data);
      setResults(res.items);
      setTotal(res.total);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na busca");
    }
  };

  return (
    <div className="space-y-4">
      <FeedHeader />
      <h1 className="text-2xl font-extrabold text-fg">Buscar no bairro</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow p-4 space-y-3"
      >
        <div>
          <label className="block text-sm font-bold text-fg mb-1">Texto</label>
          <input
            {...register("q")}
            placeholder="dica, alerta, evento..."
            className="border border-gray-300 rounded-md px-3 py-2 w-full"
          />
          {errors.q && (
            <p className="text-xs text-red-600 font-semibold">
              {errors.q.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              Categoria
            </label>
            <select
              {...register("category")}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            >
              <option value="">Todas</option>
              <option value="Geral">Geral</option>
              <option value="Dica">Dica</option>
              <option value="Alerta">Alerta</option>
              <option value="Pergunta">Pergunta</option>
              <option value="Evento">Evento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              Autor (id)
            </label>
            <input
              {...register("authorId")}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              De (ISO)
            </label>
            <input
              type="datetime-local"
              {...register("from")}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-fg mb-1">
              Até (ISO)
            </label>
            <input
              type="datetime-local"
              {...register("to")}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-700 hover:bg-green-800 text-white rounded-md px-4 py-2 font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {searched && (
        <p className="text-sm text-fg/60 font-semibold">
          {total} resultado(s)
        </p>
      )}

      <div className="space-y-4">
        {results.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
