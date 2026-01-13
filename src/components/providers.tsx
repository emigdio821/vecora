import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { ThemeProvider } from 'tanstack-theme-kit'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
        {children}
      </ThemeProvider>
    </NuqsAdapter>
  )
}
