import { QueryClient } from '@tanstack/react-query'
import { createRouter, parseSearchWith, stringifySearchWith } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { DefaultErrorBoundary } from './components/shared/errors/default-boundary'
import { NotFound } from './components/shared/errors/not-found'
import { PendingGeneric } from './components/shared/peding-generic'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 2 },
    },
  })

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    context: { queryClient },
    // defaultPreload: 'intent',
    defaultErrorComponent: DefaultErrorBoundary,
    defaultNotFoundComponent: () => <NotFound className="p-0 sm:p-0" />,
    defaultPendingComponent: () => <PendingGeneric />,
    stringifySearch: stringifySearchWith((value) => String(value)),
    parseSearch: parseSearchWith((value) => value),
  })
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
