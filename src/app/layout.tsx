import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { Geist } from 'next/font/google'
import ScreenSizeIndicator from '@/components/screen-size-indicator'
import { siteConfig } from '@/lib/config/site'
import { cn } from '@/lib/utils'

const fontSans = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },

  description: siteConfig.description,
  authors: siteConfig.autors,
  keywords: siteConfig.keywords,
  metadataBase: new URL(siteConfig.url),
  creator: 'Emigdio Torres',
  icons: {
    icon: 'favicon.ico',
    shortcut: 'images/favicon-16x16.png',
    apple: 'images/apple-touch-icon.png',
  },
  openGraph: {
    title: '@luzapien, @emigdio821',
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'es-MX',
    type: 'website',
    images: siteConfig.ogUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogUrl],
    creator: '@luzapien, @emigdio821',
  },
  // manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fff' },
    { media: '(prefers-color-scheme: dark)', color: '#000' },
  ],
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
