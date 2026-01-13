import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/owners/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return new Response('Unauthorized', { status: 401 })
        }

        try {
          const ownersData = await db.query.owners.findMany({
            with: {
              houses: true,
              violations: true,
              payments: true,
              profile: {
                with: {
                  user: true,
                },
              },
            },
          })

          return new Response(JSON.stringify(ownersData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Error fetching owners:', error)
          return new Response('Internal server error', { status: 500 })
        }
      },
      // POST: ({ request }) => {
      //   return auth.handler(request)
      // },
    },
  },
})
