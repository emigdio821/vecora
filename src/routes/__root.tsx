import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { AppProviders } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { siteConfig } from '@/lib/config/site'
import { pageTitle } from '@/lib/metadata'
import { currentUserQueryOptions } from '@/tanstack-queries/session'
import globalsCss from '@/styles/globals.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Every route guard reads the user from here; the query cache keeps it
  // from going back to the server on each navigation.
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query(currentUserQueryOptions)
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: pageTitle() },
      { name: 'description', content: siteConfig.description },
      { name: 'keywords', content: siteConfig.keywords.join(',') },
      ...siteConfig.autors.map((author) => ({ name: 'author', content: author.name })),
      { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#fff' },
      { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#000' },
      { property: 'og:description', content: siteConfig.description },
      { property: 'og:url', content: siteConfig.url },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:locale', content: 'es_MX' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: siteConfig.ogUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteConfig.name },
      { name: 'twitter:description', content: siteConfig.description },
      { name: 'twitter:image', content: siteConfig.ogUrl },
    ],
    links: [
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'shortcut icon', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets the class before React hydrates.
    <html suppressHydrationWarning lang="en" className="font-sans">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  )
}

function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Página no encontrada</EmptyTitle>
          <EmptyDescription>La dirección no existe o ya no está disponible.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link to="/" />}>
            Ir al inicio
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
