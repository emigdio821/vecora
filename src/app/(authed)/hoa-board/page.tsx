import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BoardMembersDataTable } from '@/components/hoa-board/table/data-table'
import { getCurrentUser } from '@/lib/supabase/current-user'

export const metadata: Metadata = {
  title: 'Mesa directiva',
}

export default async function HoaBoardPage() {
  // The layout already guarantees a signed-in user with roles.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

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
