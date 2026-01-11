import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router'
import Header from '@/components/Header'
import { TSDevtools } from '@/components/tanstack/devtools'
import { LINK_ICONS } from '@/config/site'
import appCss from '../styles.css?url'

interface RouteContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouteContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: light)',
        content: '#ffffff',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#09090b',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      ...LINK_ICONS,
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <TSDevtools />
        <Scripts />
      </body>
    </html>
  )
}
