import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { adminOnlyAPIMiddleware } from '@/middleware/admin'
import { authAPIMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/api/owners/$')({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: {
          middleware: [authAPIMiddleware],
          handler: async () => {
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
        },
        POST: {
          middleware: [adminOnlyAPIMiddleware],
          handler: async () => {
            return new Response('Create owner endpoint', { status: 200 })
          },
        },
      }),
  },
})
