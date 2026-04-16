/**
 * groups.test.tsx
 *
 * Verifies:
 *  - useGroupStore: setGroups, appendPosts, prependPost, resetFeed state management
 *  - groupsApi: getGroups, joinGroup, getGroupPosts, createGroupPost, rsvpEvent call correct endpoints
 *  - Groups screen files exist with required SignalR patterns
 */

// ---------------------------------------------------------------------------
// Mock expo-constants
// ---------------------------------------------------------------------------
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiUrl: 'https://api.example.com' } } },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  clear: jest.fn().mockResolvedValue(undefined),
  mergeItem: jest.fn().mockResolvedValue(undefined),
  multiMerge: jest.fn().mockResolvedValue(undefined),
  flushGetRequests: jest.fn(),
}));

// Mock shared-api-client
jest.mock('@bairronow/shared-api-client', () => ({
  createApiClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  }),
  createAuthApi: () => ({}),
  createCepApi: () => ({}),
  createVerificationApi: () => ({}),
  createProfileApi: () => ({}),
}));

import { useGroupStore } from '../useGroupStore';
import * as groupsApi from '../groupsApi';
import type { Group, GroupPost } from '../groupsApi';

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 1,
    bairroId: 10,
    name: 'Esportes Vila',
    description: 'Futebol e vôlei do bairro',
    category: 'Esportes',
    joinPolicy: 'Open',
    scope: 'Bairro',
    memberCount: 12,
    ...overrides,
  };
}

function makePost(overrides: Partial<GroupPost> = {}): GroupPost {
  return {
    id: 1,
    groupId: 1,
    authorId: 'author-1',
    author: { displayName: 'Maria', photoUrl: null, isVerified: false },
    category: 'Outros',
    body: 'Olá grupo!',
    likeCount: 0,
    commentCount: 0,
    images: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Group Store tests
// ---------------------------------------------------------------------------
describe('useGroupStore', () => {
  beforeEach(() => {
    useGroupStore.setState({
      groups: [],
      currentGroup: null,
      posts: [],
      hasMore: true,
      page: 1,
    });
  });

  it('setGroups populates groups array', () => {
    const groups = [makeGroup(), makeGroup({ id: 2, name: 'Grupo 2' })];
    useGroupStore.getState().setGroups(groups);
    expect(useGroupStore.getState().groups).toHaveLength(2);
    expect(useGroupStore.getState().groups[0].name).toBe('Esportes Vila');
  });

  it('appendPosts adds to posts array', () => {
    const posts = [makePost(), makePost({ id: 2, body: 'Post 2' })];
    useGroupStore.getState().appendPosts(posts);
    expect(useGroupStore.getState().posts).toHaveLength(2);
  });

  it('prependPost inserts at beginning', () => {
    const first = makePost({ id: 1, body: 'First' });
    const newPost = makePost({ id: 2, body: 'New' });
    useGroupStore.getState().appendPosts([first]);
    useGroupStore.getState().prependPost(newPost);
    expect(useGroupStore.getState().posts[0].body).toBe('New');
    expect(useGroupStore.getState().posts[1].body).toBe('First');
  });

  it('resetFeed clears posts and resets page', () => {
    useGroupStore.getState().appendPosts([makePost()]);
    useGroupStore.getState().resetFeed();
    expect(useGroupStore.getState().posts).toHaveLength(0);
    expect(useGroupStore.getState().page).toBe(1);
  });

  it('hasMore is false when < 20 posts appended', () => {
    const posts = Array.from({ length: 5 }, (_, i) => makePost({ id: i + 1 }));
    useGroupStore.getState().appendPosts(posts);
    expect(useGroupStore.getState().hasMore).toBe(false);
  });

  it('hasMore is true when exactly 20 posts appended (full page)', () => {
    const posts = Array.from({ length: 20 }, (_, i) => makePost({ id: i + 1 }));
    useGroupStore.getState().appendPosts(posts);
    expect(useGroupStore.getState().hasMore).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Groups API tests
// ---------------------------------------------------------------------------
describe('groupsApi — endpoint coverage', () => {
  it('getGroups calls /api/v1/groups with bairroId', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [makeGroup()] });

    const result = await groupsApi.getGroups(10);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/groups', { params: { bairroId: 10, search: undefined, page: undefined } });
    expect(result).toHaveLength(1);
  });

  it('joinGroup calls POST /api/v1/groups/:id/members', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: undefined });

    await groupsApi.joinGroup(5);
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/groups/5/members');
  });

  it('getGroupPosts calls GET /api/v1/groups/:id/posts with page', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [makePost()] });

    await groupsApi.getGroupPosts(3, 2);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/groups/3/posts', { params: { page: 2 } });
  });

  it('createGroupPost calls POST /api/v1/groups/:id/posts', async () => {
    const { apiClient } = require('@/lib/api');
    const newPost = makePost({ id: 99, body: 'Hello' });
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: newPost });

    const result = await groupsApi.createGroupPost(3, { body: 'Hello', category: 'Outros' });
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/groups/3/posts', { body: 'Hello', category: 'Outros' });
    expect(result.body).toBe('Hello');
  });

  it('rsvpEvent calls POST /api/v1/groups/:id/events/:eid/rsvp', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: undefined });

    await groupsApi.rsvpEvent(1, 10, true);
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/groups/1/events/10/rsvp', { isAttending: true });
  });

  it('leaveGroup calls DELETE /api/v1/groups/:id/members/me', async () => {
    const { apiClient } = require('@/lib/api');
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: undefined });

    await groupsApi.leaveGroup(7);
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/groups/7/members/me');
  });
});

// ---------------------------------------------------------------------------
// Static analysis: verify SignalR patterns in group feed screen
// ---------------------------------------------------------------------------
import * as fs from 'fs';
import * as path from 'path';

describe('[groupId].tsx — SignalR patterns', () => {
  const screenPath = path.resolve(__dirname, '../../../../app/(tabs)/groups/[groupId].tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(screenPath, 'utf-8');
  });

  it('invokes JoinGroup on mount (GRP-004)', () => {
    expect(src).toContain("invoke('JoinGroup'");
  });

  it('invokes LeaveGroup on unmount (cleanup)', () => {
    expect(src).toContain("invoke('LeaveGroup'");
  });

  it('has onreconnected handler — Pitfall 6 re-join on reconnect', () => {
    expect(src).toContain('onreconnected(');
  });

  it('calls rsvpEvent for RSVP button (GRP-007)', () => {
    expect(src).toContain('rsvpEvent(');
  });

  it('uses useLocalSearchParams for groupId (Expo Router dynamic route)', () => {
    expect(src).toContain('useLocalSearchParams');
  });
});

describe('groups/index.tsx — listing patterns', () => {
  const screenPath = path.resolve(__dirname, '../../../../app/(tabs)/groups/index.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(screenPath, 'utf-8');
  });

  it('calls getGroups with bairroId', () => {
    expect(src).toContain('getGroups(');
  });

  it('renders Entrar button text for joining groups', () => {
    expect(src).toContain("'Entrar'");
  });

  it('calls joinGroup on join press', () => {
    expect(src).toContain('joinGroup(');
  });
});

describe('new.tsx — create group validation', () => {
  const screenPath = path.resolve(__dirname, '../../../../app/(tabs)/groups/new.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(screenPath, 'utf-8');
  });

  it('validates name min 3 characters', () => {
    expect(src).toContain('< 3');
  });

  it('calls createGroup on submit', () => {
    expect(src).toContain('createGroup(');
  });
});
