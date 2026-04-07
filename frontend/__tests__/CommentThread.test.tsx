import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { CommentDto } from "@bairronow/shared-types";

const createCommentMock = jest.fn(async () => ({
  id: 999,
  postId: 1,
  parentCommentId: null,
  author: { id: "me", displayName: "Eu", photoUrl: null, isVerified: true },
  body: "novo",
  createdAt: new Date().toISOString(),
  editedAt: null,
  replies: [],
}));

jest.mock("@/lib/feed", () => ({
  feedClient: {
    createComment: (...args: unknown[]) => createCommentMock(...args),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    listComments: jest.fn(async () => []),
  },
}));

jest.mock("@/lib/auth", () => ({
  useAuthStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({ user: { id: "me", isVerified: true } }),
    { getState: () => ({ user: { id: "me", isVerified: true } }) }
  ),
}));

import CommentThread from "@/components/features/CommentThread";

const reply: CommentDto = {
  id: 11,
  postId: 1,
  parentCommentId: 10,
  author: {
    id: "u2",
    displayName: "Bob",
    photoUrl: null,
    isVerified: true,
  },
  body: "resposta",
  createdAt: new Date().toISOString(),
  editedAt: null,
  replies: [],
};

const root: CommentDto = {
  id: 10,
  postId: 1,
  parentCommentId: null,
  author: {
    id: "u1",
    displayName: "Alice",
    photoUrl: null,
    isVerified: true,
  },
  body: "raiz",
  createdAt: new Date().toISOString(),
  editedAt: null,
  replies: [reply],
};

describe("CommentThread", () => {
  beforeEach(() => {
    createCommentMock.mockClear();
  });

  it("renders root and reply comments", () => {
    render(<CommentThread postId={1} initial={[root]} />);
    expect(screen.getByText("raiz")).toBeInTheDocument();
    expect(screen.getByText("resposta")).toBeInTheDocument();
  });

  it("shows Responder on root but not on reply (1-level only)", () => {
    render(<CommentThread postId={1} initial={[root]} />);
    const replyButtons = screen.getAllByRole("button", { name: /Responder/ });
    // root has Responder; reply does not
    expect(replyButtons).toHaveLength(1);
  });

  it("submits new root comment via createComment", async () => {
    render(<CommentThread postId={1} initial={[]} />);
    const textarea = screen.getByPlaceholderText(/Escreva um comentário/);
    fireEvent.change(textarea, { target: { value: "novo comment" } });
    fireEvent.submit(textarea.closest("form")!);
    await waitFor(() => {
      expect(createCommentMock).toHaveBeenCalledTimes(1);
    });
    const arg = createCommentMock.mock.calls[0][0] as {
      postId: number;
      parentCommentId: number | null;
      body: string;
    };
    expect(arg.postId).toBe(1);
    expect(arg.parentCommentId).toBeNull();
    expect(arg.body).toBe("novo comment");
  });
});
