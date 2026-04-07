import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { PostDto } from "@bairronow/shared-types";

const toggleLikeMock = jest.fn(async () => ({ liked: true, count: 6 }));

jest.mock("@/lib/feed", () => ({
  feedClient: {
    toggleLike: (...args: unknown[]) => toggleLikeMock(...args),
    deletePost: jest.fn(),
    createReport: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  useAuthStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({
        user: { id: "other", isVerified: true, isAdmin: false, bairroId: 1 },
      }),
    {
      getState: () => ({
        user: { id: "other", isVerified: true, isAdmin: false, bairroId: 1 },
      }),
    }
  ),
}));

jest.mock("@/stores/feed-store", () => ({
  useFeedStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({
        setLiked: jest.fn(),
        removePost: jest.fn(),
      }),
    {
      getState: () => ({
        setLiked: jest.fn(),
        removePost: jest.fn(),
      }),
    }
  ),
}));

jest.mock("next/link", () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  Link.displayName = "Link";
  return { __esModule: true, default: Link };
});

import PostCard from "@/components/features/PostCard";

const basePost: PostDto = {
  id: 1,
  author: {
    id: "u1",
    displayName: "Maria",
    photoUrl: null,
    isVerified: true,
  },
  bairroId: 1,
  category: "Dica",
  body: "Olá vizinhos",
  images: [],
  likeCount: 5,
  commentCount: 2,
  likedByMe: false,
  isEdited: false,
  createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  editedAt: null,
};

describe("PostCard", () => {
  beforeEach(() => {
    toggleLikeMock.mockClear();
  });

  it("renders author, body, and pt-BR time-ago", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText(/Olá vizinhos/)).toBeInTheDocument();
    // pt-BR locale produces strings like "há 5 minutos" or "há cerca de"
    expect(screen.getByText(/há/)).toBeInTheDocument();
  });

  it("calls toggleLike when like button clicked", async () => {
    render(<PostCard post={basePost} />);
    const likeBtn = screen.getByRole("button", { name: /Curtir|Descurtir/ });
    fireEvent.click(likeBtn);
    await waitFor(() => {
      expect(toggleLikeMock).toHaveBeenCalledWith(1);
    });
  });

  it("shows Editado when isEdited is true", () => {
    render(<PostCard post={{ ...basePost, isEdited: true }} />);
    expect(screen.getByText(/Editado/)).toBeInTheDocument();
  });
});
