export interface Author {
  id: string;
  name: string;
  bairro: string;
  verified: boolean;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  author: Author;
  content: string;
  createdAt: string; // ISO
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  content: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  seller: Author;
}
