import '../styles/globals.css'
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Resido',
    template: `%s · Resido`,
  },
  description: 'Resido es una plataforma para la gestión de propiedades.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
