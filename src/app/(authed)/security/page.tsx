import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { RequestsDataTable } from '@/components/security/table/data-table'
import { getCurrentUser } from '@/lib/supabase/current-user'

export const metadata: Metadata = {
  title: 'Seguridad',
}

export default async function SecurityPage() {
  // The layout already guarantees a signed-in user with roles.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isAdmin = user.roles.includes('admin')
  const viewer = {
    canRequest: isAdmin || user.roles.includes('security'),
    canResolve: isAdmin || user.roles.includes('treasurer'),
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-base font-semibold">Seguridad</h1>
        <p className="text-sm text-muted-foreground">
          Gastos de seguridad: cámaras, guardias, accesos y equipo. Cada registro es una solicitud de pago que
          "Tesorería" marca como pagada o rechazada.
        </p>
      </div>

      <RequestsDataTable viewer={viewer} />
    </>
  )
}
