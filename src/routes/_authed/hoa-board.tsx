import { createFileRoute } from '@tanstack/react-router'
import { BoardMembersDataTable } from '@/components/hoa-board/table/data-table'
import { pageTitle } from '@/lib/metadata'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/_authed/hoa-board')({
  head: () => ({ meta: [{ title: pageTitle(m.common_section_hoa_board()) }] }),
  component: HoaBoardPage,
})

function HoaBoardPage() {
  const { user } = Route.useRouteContext()

  const isAdmin = user.roles.includes('admin')
  const viewer = { id: user.id, isAdmin, isManager: isAdmin || user.roles.includes('president') }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">{m.common_section_hoa_board()}</h1>
        <p className="text-sm text-muted-foreground">{m.board_page_description()}</p>
      </div>

      <BoardMembersDataTable viewer={viewer} />
    </>
  )
}
