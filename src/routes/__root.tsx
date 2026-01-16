import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { Providers } from '@/components/providers'
import { DefaultErrorBoundary } from '@/components/shared/errors/default-boundary'
import { NotFound } from '@/components/shared/errors/not-found'
// import { TSDevtools } from '@/components/tanstack/devtools'
import { Toaster } from '@/components/ui/sonner'
import { LINK_ICONS } from '@/config/site'
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
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultErrorBoundary {...props} />
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
        {/* <TSDevtools /> */}
        <Scripts />
        <Toaster />
      </body>
    </html>
  )
}
