
import { QueryClient } from "@tanstack/react-query";

// Database name constant for consistency
export const DB_NAME = 'pizza-pos-db';

// Create a consistent query client with appropriate defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      gcTime: 1000 * 60 * 10, // 10 minutes - keep cache for longer
      refetchOnWindowFocus: false, // Disable auto-refetch on window focus
    },
  },
});
