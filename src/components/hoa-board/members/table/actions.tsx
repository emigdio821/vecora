import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteHoaBoardMember } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import {
  HOA_BOARD_MEMBERS_QUERY_KEY,
  HOA_BOARD_PERIODS_QUERY_KEY,
  type HoaBoardMemberQueryData,
} from '@/api/tanstack-queries/hoa-board'
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
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { useHasRole } from '@/hooks/use-rbac'
import type { DeleteHoaBoardMemberData } from '@/schemas/hoa-board'
import { Role } from '@/types/rbac'
import { EditMemberSheet } from '../sheets/edit-member'
import { HoaMemberDetailsSheet } from '../sheets/member-details'

interface ActionsProps {
  member: HoaBoardMemberQueryData
}

export function HoaMembersTableActions({ member }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isMemberDetailsSheetOpen, setMemberDetailsSheetOpen] = useState(false)
  const [isEditMemberSheetOpen, setEditMemberSheetOpen] = useState(false)

  const canPerformActions = useHasRole([Role.SUPER_ADMIN, Role.ADMIN, Role.PRESIDENT])

  const memberFullName = `${member.firstName} ${member.lastName}`

  const deleteMemberMutation = useEntityMutation({
    mutationFn: async (data: DeleteHoaBoardMemberData) => {
      return await deleteHoaBoardMember({ data })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, HOA_BOARD_MEMBERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Miembro eliminado',
    successDescription: 'El miembro ha sido eliminado exitosamente',
    errorDescription: 'Ocurrió un error al eliminar el miembro, intenta nuevamente',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleDeleteMember() {
    await deleteMemberMutation.mutateAsync({ memberId: member.id })
  }

  return (
    <>
      {canPerformActions && (
        <>
          <AlertDialogGeneric
            open={isDeleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            action={handleDeleteMember}
            variant="destructive"
            actionLabel="Eliminar"
            title="¿Eliminar miembro?"
            description={
              <div>
                Estás por eliminar al miembro <strong>{memberFullName}</strong>. Esta acción no se puede
                deshacer.
              </div>
            }
          />

          <EditMemberSheet
            member={member}
            open={isEditMemberSheetOpen}
            onOpenChange={setEditMemberSheetOpen}
          />
        </>
      )}

      <HoaMemberDetailsSheet
        member={member}
        open={isMemberDetailsSheetOpen}
        onOpenChange={setMemberDetailsSheetOpen}
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
                {memberFullName}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setMemberDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              {canPerformActions && (
                <>
                  <DropdownMenuItem onClick={() => setEditMemberSheetOpen(true)}>
                    <IconEdit className="size-4" />
                    Editar
                  </DropdownMenuItem>

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
