// lib/react-query.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Optional: sensible default
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});