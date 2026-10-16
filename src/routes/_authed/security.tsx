import { ParaglideMessage } from '@inlang/paraglide-js-react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { RequestsDataTable } from '@/components/security/table/data-table'
import { messageMarkup } from '@/components/shared/message-markup'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/security')({
  // Only types the links into a search; the table's search box reads it through nuqs.
  validateSearch: z.object({
    'search-requests': z.string().optional().catch(undefined),
  }),
  head: () => ({ meta: [{ title: pageTitle(m.common_section_security()) }] }),
  component: SecurityPage,
})

function SecurityPage() {
  const { user } = Route.useRouteContext()

  const isAdmin = user.roles.includes('admin')
  const viewer = {
    canRequest: isAdmin || user.roles.includes('security'),
    canResolve: isAdmin || user.roles.includes('treasurer'),
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">{m.common_section_security()}</h1>
        <p className="text-sm text-muted-foreground">
          <ParaglideMessage markup={messageMarkup} message={m.requests_security_page_description} />
        </p>
      </div>

      <RequestsDataTable viewer={viewer} />
    </>
  )
}
