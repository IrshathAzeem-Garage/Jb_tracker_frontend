import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * useBackendHealth - Proactive wake-up hook for Render Free Web Service
 *
 * Requirements:
 * - Sends ONE lightweight GET /health request on initial load
 * - Cached with staleTime: Infinity & gcTime: Infinity
 * - No aggressive polling or artificial keep-alive loops
 * - 15-second timeout for cold start wake-up
 * - Returns backendStatus: 'checking' | 'ready' | 'unavailable'
 */
export const useBackendHealth = () => {
  const query = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      // 15-second timeout specifically for cold starts
      const response = await api.get('/health', { timeout: 15000 });
      return response;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1, // Only 1 attempt if the initial request times out
  });

  let backendStatus = 'checking';
  if (query.isSuccess) {
    backendStatus = 'ready';
  } else if (query.isError) {
    backendStatus = 'unavailable';
  } else if (query.isLoading || query.isPending) {
    backendStatus = 'checking';
  }

  return {
    backendStatus, // 'checking' | 'ready' | 'unavailable'
    isChecking: backendStatus === 'checking',
    isReady: backendStatus === 'ready',
    isUnavailable: backendStatus === 'unavailable',
    data: query.data,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useBackendHealth;
