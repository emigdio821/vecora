import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import { IconAlertTriangle, IconCheck, IconCopy, IconWind } from '@tabler/icons-react'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { AppProviders } from '@/components/providers'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { siteConfig } from '@/lib/config/site'
import { pageTitle } from '@/lib/metadata'
import { intlLocale } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
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
      { property: 'og:locale', content: intlLocale().replace('-', '_') },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: siteConfig.ogUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteConfig.name },
      { name: 'twitter:description', content: siteConfig.description },
      { name: 'twitter:image', content: siteConfig.ogUrl },
    ],
    links: [
      { rel: 'stylesheet', href: globalsCss },
      { rel: 'preload', href: interLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'shortcut icon', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets the class before React hydrates.
    <html suppressHydrationWarning lang={getLocale()} className="relative font-sans">
      <head>
        <HeadContent />
      </head>
      <body className="isolate">
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
          <EmptyMedia variant="icon">
            <IconWind />
          </EmptyMedia>
          <EmptyTitle>{m.common_not_found_title()}</EmptyTitle>
          <EmptyDescription>{m.common_not_found_description()}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link to="/" />}>
            {m.common_go_home()}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}

/**
 * Any error a route throws (loader, beforeLoad or render) that no closer route
 * handles. Shows the message so the user can send it to the admin.
 */
function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const message = (error instanceof Error ? error.message : String(error)) || m.common_error_unknown()

  async function copy() {
    // The page tells the admin where it happened.
    await navigator.clipboard.writeText(
      `${message}\n${m.common_error_page({ path: window.location.pathname })}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconAlertTriangle />
          </EmptyMedia>
          <EmptyTitle>{m.common_error_title()}</EmptyTitle>
          <EmptyDescription>{m.common_error_description()}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <InputGroup>
            <InputGroupTextarea
              readOnly
              value={message}
              aria-label={m.common_error()}
              // The class lands on the wrapper; `*:` caps the textarea itself, which otherwise grows to fit.
              className="text-xs *:max-h-40"
              onFocus={(e) => {
                e.currentTarget.select()
              }}
            />
            <InputGroupAddon
              align="block-start"
              className="justify-between rounded-t-lg border-b bg-muted/72 p-2!"
            >
              <InputGroupText className="ps-1 text-xs">{m.common_error()}</InputGroupText>
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={m.common_error_copy()}
                      onClick={() => {
                        void copy()
                      }}
                    >
                      {copied ? <IconCheck className="text-success-foreground" /> : <IconCopy />}
                    </Button>
                  }
                />
                <TooltipContent>{copied ? m.common_error_copied() : m.common_error_copy()}</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>

          <div className="flex gap-2">
            {/* Reruns the loaders, which also clears this error. */}
            <Button
              onClick={() => {
                void router.invalidate()
              }}
            >
              {m.common_action_retry()}
            </Button>
            <Button variant="outline" render={<Link to="/" />}>
              {m.common_go_home()}
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  )
}
