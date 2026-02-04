import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteHoaBoardPeriod } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOA_BOARD_MEMBERS_QUERY_KEY, HOA_BOARD_PERIODS_QUERY_KEY } from '@/api/tanstack-queries/hoa-board'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { useUserRoles } from '@/hooks/use-user-roles'
import { formatDate } from '@/lib/utils'
import type { DeleteHoaBoardPeriodData } from '@/schemas/hoa-board'
import { EditHoaPeriodSheet } from '../sheets/edit-period'
import { HoaPeriodDetailsSheet } from '../sheets/period-details'

interface ActionsProps {
  period: HoaBoardPeriodWithMembers
}

export function HoaPeriodsTableActions({ period }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isEditPeriodSheetOpen, setEditPeriodSheetOpen] = useState(false)
  const [isMemberDetailsSheetOpen, setMemberDetailsSheetOpen] = useState(false)

  const { isAdmin } = useUserRoles()

  const deletePeriodMutation = useEntityMutation({
    mutationFn: async (data: DeleteHoaBoardPeriodData) => {
      return await deleteHoaBoardPeriod({ data })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, HOA_BOARD_MEMBERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Periodo eliminado',
    successDescription: 'El periodo ha sido eliminado exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar el periodo, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleDeletePeriod() {
    await deletePeriodMutation.mutateAsync({ periodId: period.id })
  }

  return (
    <>
      {isAdmin && (
        <>
          <AlertDialogGeneric
            state={{
              isOpen: isDeleteDialogOpen,
              onOpenChange: setDeleteDialogOpen,
            }}
            action={handleDeletePeriod}
            variant="destructive"
            actionLabel="Eliminar"
            title="¿Eliminar periodo?"
            description={
              <div>
                Estás por eliminar el periodo{' '}
                <strong>{formatDate(period.createdAt, { month: 'short', year: '2-digit' })}</strong> -{' '}
                <strong>{formatDate(period.endDate, { month: 'short', year: '2-digit' })}</strong>. Esta
                acción no se puede deshacer.
              </div>
            }
          />

          <EditHoaPeriodSheet
            period={period}
            state={{ isOpen: isEditPeriodSheetOpen, onOpenChange: setEditPeriodSheetOpen }}
          />
        </>
      )}

      <HoaPeriodDetailsSheet
        period={period}
        state={{ isOpen: isMemberDetailsSheetOpen, onOpenChange: setMemberDetailsSheetOpen }}
      />

      <div className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button aria-label="Table actions" size="icon" variant="ghost" className="ml-auto">
                <IconDotsVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="max-w-42">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
                {formatDate(period.createdAt)}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setMemberDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditPeriodSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <IconTrash className="size-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
