import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteHouse } from '@/api/server-functions/houses'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/api/tanstack-queries/houses'
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
import type { DeleteHouseData } from '@/schemas/houses'
import { EditHouseSheet } from '../sheets/edit-house'
import { HouseDetailsSheet } from '../sheets/house-details'

interface ActionsProps {
  house: HouseQueryData
}

export function HousesTableActions({ house }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isHouseDetailsSheetOpen, setHouseDetailsSheetOpen] = useState(false)
  const [isEditHouseSheetOpen, setEditHouseSheetOpen] = useState(false)

  const deleteHouseMutation = useEntityMutation({
    mutationFn: async (data: DeleteHouseData) => {
      return await deleteHouse({ data })
    },
    invalidateKeys: [HOUSES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Casa eliminada',
    successDescription: 'La casa ha sido eliminada exitosamente',
    errorDescription: 'Ocurrió un error al eliminar la casa, intenta nuevamente',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleDeleteHouse() {
    deleteHouseMutation.mutate({ houseId: house.id })
  }

  return (
    <>
      <AlertDialogGeneric
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={handleDeleteHouse}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar casa?"
        description={
          <div>
            Estás por eliminar la casa <strong>{house.houseNumber}</strong>. Esta acción no se puede deshacer.
          </div>
        }
      />

      <HouseDetailsSheet
        house={house}
        state={{ isOpen: isHouseDetailsSheetOpen, onOpenChange: setHouseDetailsSheetOpen }}
      />

      <EditHouseSheet
        house={house}
        state={{ isOpen: isEditHouseSheetOpen, onOpenChange: setEditHouseSheetOpen }}
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
                {house.houseNumber}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setHouseDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditHouseSheetOpen(true)}>
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
