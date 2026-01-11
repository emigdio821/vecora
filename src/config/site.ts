export const SITE_CONFIG = {
  title: 'resido',
  description: 'An open-source and simple residential manager.',
  icons: {
    favicon: '/images/favicon.ico',
    appleTouchIcon: '/images/apple-touch-icon.png',
    s16Icon: '/images/favicon-16x16.png',
    s32Icon: '/images/favicon-32x32.png',
    s192Icon: '/images/android-chrome-192x192.png',
    s512Icon: '/images/android-chrome-512x512.png',
  },
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
