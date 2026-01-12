import { ThemeProvider } from 'tanstack-theme-kit'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
      {children}
    </ThemeProvider>
  )
}
