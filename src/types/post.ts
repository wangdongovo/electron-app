// src/types/post.ts
export interface Post {
  id: number;
  title: string;
  body: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}