'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { AnchoredToastProvider, ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from './ui/tooltip'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2 },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ToastProvider>
          <AnchoredToastProvider>
            <TooltipProvider delay={200}>{children}</TooltipProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </NuqsAdapter>

      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
