const appName = 'Resido'
const appDesc = 'An open-source and simple residential manager.'

export const SITE_CONFIG = {
  title: appName,
  description: appDesc,
  url: '', // TODO: Add site URL here
  icons: {
    favicon: '/images/favicon.ico',
    appleTouchIcon: '/images/apple-touch-icon.png',
    s16Icon: '/images/favicon-16x16.png',
    s32Icon: '/images/favicon-32x32.png',
    s192Icon: '/images/android-chrome-192x192.png',
    s512Icon: '/images/android-chrome-512x512.png',
  },
  ogTwitter: {
    card: 'summary_large_image',
    title: appName,
    description: appDesc,
    image: '', // TODO: Add a default image URL here
    creator: '@luzapien, @emigdio821',
  },
  og: {
    title: appName,
    description: appDesc,
    url: '', // TODO: Add site URL here
    siteName: appName,
    type: 'website',
    image: '', // TODO: Add a default image URL here
    locale: 'es_MX',
  },
  keywords: [
    'Resido',
    'React',
    'TanStack Start',
    'TanStack Query',
    'Residential Manager',
    'Tailwind',
    'opensource',
    'Drizzle ORM',
    'TypeScript',
  ],
} as const

export const LINK_ICONS = [
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: SITE_CONFIG.icons.appleTouchIcon,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: SITE_CONFIG.icons.s16Icon,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: SITE_CONFIG.icons.s32Icon,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    href: SITE_CONFIG.icons.s192Icon,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '512x512',
    href: SITE_CONFIG.icons.s512Icon,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon-16x16.png',
  },

  {
    rel: 'shortcut icon',
    href: SITE_CONFIG.icons.s512Icon,
  },
  { rel: 'icon', href: SITE_CONFIG.icons.favicon },
] as const
