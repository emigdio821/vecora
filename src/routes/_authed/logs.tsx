import { createFileRoute, redirect } from '@tanstack/react-router'
import { LogsDataTable } from '@/components/logs/table/data-table'
import { can } from '@/lib/auth/permissions'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/logs')({
  // Admin only. The server function refuses everyone else anyway; this keeps them off an empty page.
  beforeLoad: ({ context }) => {
    if (!can(context.user.roles, { log: ['read'] })) {
      throw redirect({ to: '/' })
    }
  },
  head: () => ({ meta: [{ title: pageTitle(m.common_section_logs()) }] }),
  component: LogsPage,
})

function LogsPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">{m.common_section_logs()}</h1>
        <p className="text-sm text-muted-foreground">{m.logs_page_description()}</p>
      </div>

      <LogsDataTable />
    </>
  )
}
