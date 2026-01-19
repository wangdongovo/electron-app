import apiClient from './apiClient';
import { Post } from '@shared/types/post';

// 获取所有帖子
export const getPosts = async (): Promise<Post[]> => {
  try {
    const response = await apiClient.get<Post[]>('/posts');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    throw error;
  }
};

// 获取单个帖子
export const getPostById = async (id: string | number): Promise<Post> => {
  try {
    const response = await apiClient.get<Post>(`/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch post with id ${id}:`, error);
    throw error;
  }
};