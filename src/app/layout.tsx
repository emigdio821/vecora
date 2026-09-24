import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Geist } from 'next/font/google'
import ScreenSizeIndicator from '@/components/screen-size-indicator'
import { cn } from '@/lib/utils'

const fontSans = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Resido',
    template: `%s · Resido`,
  },
  description: 'Resido es una plataforma para la gestión de propiedades.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html suppressHydrationWarning lang="en" className={cn('font-sans', fontSans.variable)}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
          {children}
          <ScreenSizeIndicator />
        </ThemeProvider>
      </body>
    </html>
  )
}
