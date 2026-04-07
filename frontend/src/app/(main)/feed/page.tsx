import FeedList from "@/components/features/feed/FeedList";
import type { Post } from "@/types/feed";

const stubPosts: Post[] = [
  {
    id: "1",
    author: {
      id: "u1",
      name: "Mariana Silva",
      bairro: "Praia da Costa",
      verified: true,
    },
    content:
      "Alguém sabe se a feira de domingo na Praça do Pelicano vai acontecer mesmo com a chuva? 🌧️",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    likeCount: 8,
    commentCount: 3,
  },
  {
    id: "2",
    author: {
      id: "u2",
      name: "João Pedro",
      bairro: "Itapoã",
      verified: true,
    },
    content:
      "Achei um cachorrinho perdido na rua Henrique Moscoso. Coleira azul, parece manso. Estou em casa, quem reconhecer me chame!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likeCount: 24,
    commentCount: 11,
  },
  {
    id: "3",
    author: {
      id: "u3",
      name: "Síndico Carlos",
      bairro: "Edifício Atlântico",
      verified: true,
    },
    content:
      "Lembrete: assembleia condominial nesta quinta-feira às 19h no salão de festas. Pauta: reforma da fachada.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likeCount: 4,
    commentCount: 2,
  },
  {
    id: "4",
    author: {
      id: "u4",
      name: "Padaria do Zé",
      bairro: "Centro",
      verified: true,
    },
    content:
      "Pão fresquinho saindo agora! Promoção: 12 pães franceses por R$ 8,00 até o fim da tarde. 🥖",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    likeCount: 31,
    commentCount: 5,
  },
];

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-fg">Feed do bairro</h1>
        <p className="text-fg/60 font-medium">
          O que está acontecendo perto de você
        </p>
      </header>
      <FeedList posts={stubPosts} />
    </div>
  );
}
