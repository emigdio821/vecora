import { IconDotsVertical, IconEdit, IconTrash, IconUser } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import type { HouseWithOwner } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { type DeleteOwnerData, deleteOwner } from '@/server-fns/owners'
import { EditHouseSheet } from '../sheets/edit-house'
import { HouseDetailsSheet } from '../sheets/house-details'

interface ActionsProps {
  house: HouseWithOwner
}

export function HousesTableActions({ house }: ActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isHouseDetailsSheetOpen, setIsHouseDetailsSheetOpen] = useState(false)
  const [isEditHouseSheetOpen, setIsEditHouseSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteOwnerMutation = useMutation({
    mutationFn: async (data: DeleteOwnerData) => {
      return await deleteOwner({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      setIsDeleteDialogOpen(false)
      toast.success('Casa eliminada exitosamente.')
    },
    onError: () => {
      toast.error('Ocurrió un error al eliminar la casa, intenta nuevamente.')
    },
  })

  function handleDeleteOwner() {
    deleteOwnerMutation.mutate({ ownerId: house.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar casa?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la casa <strong>{house.houseNumber}</strong>. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOwnerMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteOwner}
              disabled={deleteOwnerMutation.isPending}
            >
              Eliminar
              {deleteOwnerMutation.isPending && <LoaderIcon />}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HouseDetailsSheet
        house={house}
        state={{ isOpen: isHouseDetailsSheetOpen, onOpenChange: setIsHouseDetailsSheetOpen }}
      />

      <EditHouseSheet
        house={house}
        state={{ isOpen: isEditHouseSheetOpen, onOpenChange: setIsEditHouseSheetOpen }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label="Table actions" size="icon" variant="ghost">
              <IconDotsVertical className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="max-w-42">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
              {house.houseNumber}
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={() => setIsHouseDetailsSheetOpen(true)}>
              <IconUser className="size-4" />
              Información
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setIsEditHouseSheetOpen(true)}>
              <IconEdit className="size-4" />
              Editar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <IconTrash className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
