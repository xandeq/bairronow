import { create } from 'zustand';
import type { Group, GroupPost } from './groupsApi';

interface GroupStore {
  groups: Group[];
  currentGroup: Group | null;
  posts: GroupPost[];
  hasMore: boolean;
  page: number;
  setGroups: (groups: Group[]) => void;
  setCurrentGroup: (g: Group | null) => void;
  appendPosts: (posts: GroupPost[]) => void;
  prependPost: (post: GroupPost) => void;
  resetFeed: () => void;
  incrementPage: () => void;
}

export const useGroupStore = create<GroupStore>((set) => ({
  groups: [],
  currentGroup: null,
  posts: [],
  hasMore: true,
  page: 1,
  setGroups: (groups) => set({ groups }),
  setCurrentGroup: (currentGroup) => set({ currentGroup }),
  appendPosts: (newPosts) => set((s) => ({
    posts: [...s.posts, ...newPosts],
    hasMore: newPosts.length === 20,
  })),
  prependPost: (post) => set((s) => ({ posts: [post, ...s.posts] })),
  resetFeed: () => set({ posts: [], hasMore: true, page: 1 }),
  incrementPage: () => set((s) => ({ page: s.page + 1 })),
}));
