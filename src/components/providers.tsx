import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { AnchoredToastProvider, ToastProvider } from './ui/toast'
import { TooltipProvider } from './ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
        <ToastProvider>
          <AnchoredToastProvider>
            <TooltipProvider delay={200}>{children}</TooltipProvider>
          </AnchoredToastProvider>
        </ToastProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}
