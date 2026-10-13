import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { useIsMobile } from '@/hooks/use-media-query'
import ScreenSizeIndicator from './screen-size-indicator'
import { ThemeProvider } from './theme-provider'
import { AnchoredToastProvider, ToastProvider } from './ui/toast'
import { TooltipProvider } from './ui/tooltip'

/** Everything around every page. The router provides the QueryClient (see router.tsx). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  return (
    <ThemeProvider>
      <ToastProvider position={isMobile ? 'top-center' : 'bottom-right'}>
        <AnchoredToastProvider>
          <NuqsAdapter>
            <TooltipProvider delay={200}>{children}</TooltipProvider>
          </NuqsAdapter>
        </AnchoredToastProvider>
      </ToastProvider>
      <ScreenSizeIndicator disabled />
      <ReactQueryDevtools />
    </ThemeProvider>
  )
}
