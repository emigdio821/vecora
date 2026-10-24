import { IconTool } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

/** The maintenance page (see src/lib/maintenance.ts). Laid out like the 404. */
export const Route = createFileRoute('/unavailable')({
  head: () => ({
    meta: [{ title: pageTitle(m.common_maintenance_title()) }, { name: 'robots', content: 'noindex' }],
  }),
  component: UnavailablePage,
})

function UnavailablePage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconTool />
          </EmptyMedia>
          <EmptyTitle>{m.common_maintenance_title()}</EmptyTitle>
          <EmptyDescription>{m.common_maintenance_description()}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {/* A full load, not a router link: the server decides whether the app is open again. */}
          <a href="/" className={buttonVariants({ variant: 'outline' })}>
            {m.common_action_retry()}
          </a>
        </EmptyContent>
      </Empty>
    </main>
  )
}
