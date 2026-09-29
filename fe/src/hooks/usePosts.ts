import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '../services/api';
import type { PostRequest } from '../types';

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters?: { userId?: number }) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
};

// Get all posts
export const usePosts = (userId?: number) => {
  return useQuery({
    queryKey: postKeys.list({ userId }),
    queryFn: async () => {
      const response = userId 
        ? await postApi.getByUserId(userId)
        : await postApi.getAll();
      return response.data.data;
    },
  });
};

// Get post by id
export const usePost = (id: number) => {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const response = await postApi.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};


// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PostRequest) => postApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};
