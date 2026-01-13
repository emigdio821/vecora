import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { DefaultError } from '@/components/default-error'
import { NotFound } from '@/components/not-found'
import { Providers } from '@/components/providers'
import { TSDevtools } from '@/components/tanstack/devtools'
import { LINK_ICONS } from '@/config/site'
import { FONT_LINKS } from '@/lib/fonts'
import { createSEOMeta } from '@/lib/seo'
import appCss from '@/styles/app.css?url'

interface RouteContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouteContext>()({
  head: () => ({
    meta: createSEOMeta(),
    links: [
      ...LINK_ICONS,
      ...FONT_LINKS,
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultError {...props} />
      </RootDocument>
    )
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="relative flex min-h-dvh flex-col antialiased">
        <Providers>{children}</Providers>
        <TSDevtools />
        <Scripts />
      </body>
    </html>
  )
}
