import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteExternalUser } from '@/api/server-functions/external-users'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { EXTERNAL_USERS_QUERY_KEY } from '@/api/tanstack-queries/external-users'
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
import type { SelectExternalUser } from '@/db/schemas/zod/external-users'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { DeleteExternalUserData } from '@/schemas/external-users'
import { EditExternalUserSheet } from '../sheets/edit-external-user'
import { ExternalUserDetailsSheet } from '../sheets/external-user-details'

interface ActionsProps {
  externalUser: SelectExternalUser
}

export function ExternalUsersTableActions({ externalUser }: ActionsProps) {
  const externalUserFullName = `${externalUser.firstName} ${externalUser.lastName}`.trim()
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isExternalUserDetailsSheetOpen, setExternalUserDetailsSheetOpen] = useState(false)
  const [isEditExternalUserSheetOpen, setEditExternalUserSheetOpen] = useState(false)

  const deleteExternalUserMutation = useEntityMutation({
    mutationFn: async (data: DeleteExternalUserData) => {
      return await deleteExternalUser({ data })
    },
    invalidateKeys: [EXTERNAL_USERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Usuario externo eliminado',
    successDescription: 'El usuario externo ha sido eliminado exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar el usuario externo, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleDeleteExternalUser() {
    deleteExternalUserMutation.mutate({ externalUserId: externalUser.id })
  }

  return (
    <>
      <AlertDialogGeneric
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={handleDeleteExternalUser}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar usuario externo?"
        description={
          <span>
            Estás por eliminar a <strong>{externalUserFullName}</strong>. Esta acción no se puede deshacer.
          </span>
        }
      />

      <ExternalUserDetailsSheet
        externalUser={externalUser}
        state={{ isOpen: isExternalUserDetailsSheetOpen, onOpenChange: setExternalUserDetailsSheetOpen }}
      />

      <EditExternalUserSheet
        externalUser={externalUser}
        state={{ isOpen: isEditExternalUserSheetOpen, onOpenChange: setEditExternalUserSheetOpen }}
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
                {externalUserFullName}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setExternalUserDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditExternalUserSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <IconTrash className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
