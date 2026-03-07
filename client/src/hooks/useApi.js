import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * Generic GET query hook.
 * @param {string|Array} queryKey  TanStack Query key
 * @param {string} url             API endpoint
 * @param {object} options         Additional react-query options
 */
export function useApiQuery(queryKey, url, options = {}) {
    return useQuery({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        queryFn: async () => {
            const { data } = await api.get(url);
            return data.data;
        },
        ...options,
    });
}

/**
 * Generic POST/PUT/DELETE mutation hook.
 * @param {string} url        API endpoint
 * @param {string} method     HTTP method (post, put, patch, delete)
 * @param {object} options    Additional react-query mutation options
 */
export function useApiMutation(url, method = 'post', options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api[method](url, payload);
            return data;
        },
        onSuccess: () => {
            // Invalidate related queries if specified
            if (options.invalidateKeys) {
                options.invalidateKeys.forEach((key) => {
                    queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
                });
            }
        },
        ...options,
    });
}
