import { env } from './env'

export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: 'Vecora',
  description: 'An open-source and simple residential manager.',
  ogUrl: new URL('/api/og', env.VITE_SITE_URL).href,
  autors: [
    {
      name: 'María Rodríguez',
      url: 'https://github.com/luzapien',
    },
    {
      name: 'Emigdio Torres',
      url: 'https://github.com/emigdio821',
    },
  ],
  keywords: [
    'Vecora',
    'React',
    'TanStack Start',
    'TanStack Query',
    'Residential Manager',
    'Tailwind',
    'opensource',
    'Drizzle ORM',
    'TypeScript',
    'coss/ui',
  ],
}
