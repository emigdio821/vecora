import { IconDotsVertical, IconEdit, IconHome, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteOwner } from '@/api/server-functions/owners'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOUSES_QUERY_KEY } from '@/api/tanstack-queries/houses'
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
import type { HouseWithOwner } from '@/db/schemas/zod/houses'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { DeleteOwnerData } from '@/schemas/owners'
import { EditHouseSheet } from '../sheets/edit-house'
import { HouseDetailsSheet } from '../sheets/house-details'

interface ActionsProps {
  house: HouseWithOwner
}

export function HousesTableActions({ house }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isHouseDetailsSheetOpen, setHouseDetailsSheetOpen] = useState(false)
  const [isEditHouseSheetOpen, setEditHouseSheetOpen] = useState(false)

  const deleteHouseMutation = useEntityMutation({
    mutationFn: async (data: DeleteOwnerData) => {
      return await deleteOwner({ data })
    },
    invalidateKeys: [HOUSES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Casa eliminada',
    successDescription: 'La casa ha sido eliminada exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar la casa, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleDeleteOwner() {
    deleteHouseMutation.mutate({ ownerId: house.id })
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
            <AlertDialogClose render={<Button variant="outline" disabled={deleteHouseMutation.isPending} />}>
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleDeleteOwner}
                  disabled={deleteHouseMutation.isPending}
                />
              }
            >
              Eliminar
              {deleteHouseMutation.isPending && <LoaderIcon />}
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
