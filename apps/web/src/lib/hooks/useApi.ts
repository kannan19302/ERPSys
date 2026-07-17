import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete, type ApiRequestError } from '../api';

export function useApiQuery<T = unknown>(
  key: readonly unknown[],
  path: string,
  options?: Omit<UseQueryOptions<T, ApiRequestError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, ApiRequestError>({
    queryKey: key,
    queryFn: () => api<T>(path),
    ...options,
  });
}

export function useApiPost<TData = unknown, TBody = unknown>(
  path: string,
  options?: Omit<UseMutationOptions<TData, ApiRequestError, TBody>, 'mutationFn'>,
) {
  return useMutation<TData, ApiRequestError, TBody>({
    mutationFn: (body) => apiPost<TData>(path, body),
    ...options,
  });
}

export function useApiPatch<TData = unknown, TBody = unknown>(
  path: string,
  options?: Omit<UseMutationOptions<TData, ApiRequestError, TBody>, 'mutationFn'>,
) {
  return useMutation<TData, ApiRequestError, TBody>({
    mutationFn: (body) => apiPatch<TData>(path, body),
    ...options,
  });
}

export function useApiDelete<TData = unknown>(
  path: string,
  options?: Omit<UseMutationOptions<TData, ApiRequestError, void>, 'mutationFn'>,
) {
  return useMutation<TData, ApiRequestError, void>({
    mutationFn: () => apiDelete<TData>(path),
    ...options,
  });
}

export function useInvalidate() {
  const queryClient = useQueryClient();
  return (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key });
}
