'use client';

import { DirectionProvider } from '@radix-ui/react-direction';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <DirectionProvider dir="rtl">
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DirectionProvider>
  );
}
