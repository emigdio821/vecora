import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import ScreenSizeIndicator from './screen-size-indicator'
import { ThemeProvider } from './theme-provider'
import { AnchoredToastProvider, ToastProvider } from './ui/toast'
import { TooltipProvider } from './ui/tooltip'

/** Everything around every page. The router provides the QueryClient (see router.tsx). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
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
