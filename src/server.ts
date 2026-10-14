import { handleStartError } from '@tanstack/react-start/server'
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { paraglideMiddleware } from '@/paraglide/server'

// Every request (pages, server functions, the PDF) runs with the locale of its
// cookie, so getLocale() and the m.* messages answer in the visitor's language.
export default createServerEntry({
  fetch(request) {
    return paraglideMiddleware(request, async () => {
      try {
        return await handler.fetch(request)
      } catch (error) {
        // Start doesn't log the errors it turns into its error response, so do it
        // here to keep them in the Vercel logs.
        console.error(error)
        return handleStartError(error)
      }
    })
  },
})
