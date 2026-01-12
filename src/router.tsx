import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const queryClient = new QueryClient()

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    context: {
      queryClient,
    },
    defaultNotFoundComponent: () => <div>404 - Not Found</div>,

    // defaultPreload: 'intent',
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
