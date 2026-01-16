import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { ThemeProvider } from 'tanstack-theme-kit'
import { TooltipProvider } from './ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}
