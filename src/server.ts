import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { paraglideMiddleware } from '@/paraglide/server'

// Every request (pages, server functions, the PDF) runs with the locale of its
// cookie, so getLocale() and the m.* messages answer in the visitor's language.
export default createServerEntry({
  fetch(request) {
    return paraglideMiddleware(request, () => handler.fetch(request))
  },
})
