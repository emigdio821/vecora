import { IconDotsVertical, IconEdit, IconTrash, IconUser } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import { toastManager } from '@/components/ui/toast'
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import type { DeleteOwnerData } from '@/schemas/owners'
import { deleteOwner } from '@/server-fns/owners'
import { EditOwnerSheet } from '../sheets/edit-owner'
import { OwnerDetailsSheet } from '../sheets/owner-details'

interface ActionsProps {
  owner: OwnerWithRelations
}

export function OwnersTableActions({ owner }: ActionsProps) {
  const ownerFullName = `${owner.firstName} ${owner.lastName}`.trim()
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isOwnerDetailsSheetOpen, setOwnerDetailsSheetOpen] = useState(false)
  const [isEditOwnerSheetOpen, setEditOwnerSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteOwnerMutation = useMutation({
    mutationFn: async (data: DeleteOwnerData) => {
      return await deleteOwner({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      setDeleteDialogOpen(false)

      toastManager.add({
        type: 'success',
        title: 'Propietario eliminado',
        description: 'El propietario ha sido eliminado exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting owner:', error)
      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al eliminar el propietario, intenta nuevamente.',
      })
    },
  })

  function handleDeleteOwner() {
    deleteOwnerMutation.mutate({ ownerId: owner.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propietario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{ownerFullName}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" disabled={deleteOwnerMutation.isPending} />}>
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleDeleteOwner}
                  disabled={deleteOwnerMutation.isPending}
                />
              }
            >
              Eliminar
              {deleteOwnerMutation.isPending && <LoaderIcon />}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      <OwnerDetailsSheet
        owner={owner}
        state={{ isOpen: isOwnerDetailsSheetOpen, onOpenChange: setOwnerDetailsSheetOpen }}
      />

      <EditOwnerSheet
        owner={owner}
        state={{ isOpen: isEditOwnerSheetOpen, onOpenChange: setEditOwnerSheetOpen }}
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
                {ownerFullName}
              </MenuGroupLabel>
              <MenuItem onClick={() => setOwnerDetailsSheetOpen(true)}>
                <IconUser className="size-4" />
                Información
              </MenuItem>

              <MenuItem onClick={() => setEditOwnerSheetOpen(true)}>
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
