import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  // One client per request on the server; one per tab in the browser.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 2 },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    // Preloads go through the query cache, which owns staleness.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })

  // Also provides QueryClientProvider around the app.
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
