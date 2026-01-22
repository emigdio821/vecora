import { IconDotsVertical, IconEdit, IconTrash, IconUser } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteExternalUser } from '@/api/server-functions/external-users'
import { EXTERNAL_USERS_QUERY_KEY } from '@/api/tanstack-queries/external-users'
import { LoaderIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
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
    invalidateKeys: [EXTERNAL_USERS_QUERY_KEY],
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario externo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{externalUserFullName}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={deleteExternalUserMutation.isPending} />}
            >
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleDeleteExternalUser}
                  disabled={deleteExternalUserMutation.isPending}
                />
              }
            >
              Eliminar
              {deleteExternalUserMutation.isPending && <LoaderIcon />}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      <ExternalUserDetailsSheet
        externalUser={externalUser}
        state={{ isOpen: isExternalUserDetailsSheetOpen, onOpenChange: setExternalUserDetailsSheetOpen }}
      />

      <EditExternalUserSheet
        externalUser={externalUser}
        state={{ isOpen: isEditExternalUserSheetOpen, onOpenChange: setEditExternalUserSheetOpen }}
      />

      <div className="flex">
        <Menu>
          <MenuTrigger
            render={
              <Button aria-label="Table actions" size="icon" variant="ghost" className="ml-auto">
                <IconDotsVertical className="size-4" />
              </Button>
            }
          />
          <MenuPopup align="end" className="max-w-42">
            <MenuGroup>
              <MenuGroupLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
                {externalUserFullName}
              </MenuGroupLabel>
              <MenuItem onClick={() => setExternalUserDetailsSheetOpen(true)}>
                <IconUser className="size-4" />
                Información
              </MenuItem>

              <MenuItem onClick={() => setEditExternalUserSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </MenuItem>

              <MenuSeparator />

              <MenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <IconTrash className="size-4" />
                Eliminar
              </MenuItem>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </div>
    </>
  )
}
