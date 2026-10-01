import { createFileRoute } from '@tanstack/react-router'
import { BoardMembersDataTable } from '@/components/hoa-board/table/data-table'
import { pageTitle } from '@/lib/metadata'

export const Route = createFileRoute('/_authed/hoa-board')({
  head: () => ({ meta: [{ title: pageTitle('Mesa directiva') }] }),
  component: HoaBoardPage,
})

function HoaBoardPage() {
  const { user } = Route.useRouteContext()

  const isAdmin = user.roles.includes('admin')
  const viewer = { id: user.id, isAdmin, isManager: isAdmin || user.roles.includes('president') }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">Mesa directiva</h1>
        <p className="text-sm text-muted-foreground">
          Solo las personas en esta lista pueden entrar a Vecora. Cada integrante recibe su acceso con un
          enlace que le compartes tú.
        </p>
      </div>

      <BoardMembersDataTable viewer={viewer} />
    </>
  )
}
