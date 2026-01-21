import { IconDotsVertical, IconEdit, IconHome, IconTrash } from '@tabler/icons-react'
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
import type { HouseWithOwner } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { type DeleteOwnerData, deleteOwner } from '@/server-fns/owners'
import { EditHouseSheet } from '../sheets/edit-house'
import { HouseDetailsSheet } from '../sheets/house-details'

interface ActionsProps {
  house: HouseWithOwner
}

export function HousesTableActions({ house }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isHouseDetailsSheetOpen, setHouseDetailsSheetOpen] = useState(false)
  const [isEditHouseSheetOpen, setEditHouseSheetOpen] = useState(false)
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
        title: 'Casa eliminada',
        description: 'La casa ha sido eliminada exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting house:', error)

      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al eliminar la casa, intenta nuevamente.',
      })
    },
  })

  function handleDeleteOwner() {
    deleteOwnerMutation.mutate({ ownerId: house.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar casa?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la casa <strong>{house.houseNumber}</strong>. Esta acción no se puede
              deshacer.
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

      <HouseDetailsSheet
        house={house}
        state={{ isOpen: isHouseDetailsSheetOpen, onOpenChange: setHouseDetailsSheetOpen }}
      />

      <EditHouseSheet
        house={house}
        state={{ isOpen: isEditHouseSheetOpen, onOpenChange: setEditHouseSheetOpen }}
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
                {house.houseNumber}
              </MenuGroupLabel>

              <MenuItem onClick={() => setHouseDetailsSheetOpen(true)}>
                <IconHome className="size-4" />
                Información
              </MenuItem>

              <MenuItem onClick={() => setEditHouseSheetOpen(true)}>
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
