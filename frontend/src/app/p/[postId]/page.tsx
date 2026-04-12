import type { Metadata } from "next";
import PostPreviewClient from "./PostPreviewClient";

export const metadata: Metadata = {
  title: "BairroNow - Post do Bairro",
  openGraph: {
    title: "BairroNow - Veja o que esta acontecendo no bairro",
    description: "Conecte-se com seus vizinhos no BairroNow.",
    images: [
      {
        url: "https://bairronow.com.br/og-default.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export function generateStaticParams() {
  return [{ postId: "preview" }];
}

export default async function PostPreviewPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <PostPreviewClient postId={postId} />;
}
