import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogsDataTable } from '@/components/logs/table/data-table'
import { getCurrentUser } from '@/lib/supabase/current-user'

export const metadata: Metadata = {
  title: 'Historial',
}

export default async function LogsPage() {
  // The layout already guarantees a signed-in user with roles.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Admin only. RLS hides the rows anyway; this keeps others off an empty page.
  if (!user.roles.includes('admin')) redirect('/')

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">Historial</h1>
        <p className="text-sm text-muted-foreground">
          Todo lo que se ha creado, editado o eliminado en la aplicación, quién lo hizo y cuándo. No se puede
          modificar.
        </p>
      </div>

      <LogsDataTable />
    </>
  )
}
