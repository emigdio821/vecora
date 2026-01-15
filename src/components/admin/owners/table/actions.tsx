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
import type { OwnerWithRelations } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { type DeleteOwnerData, deleteOwner } from '@/server-fns/owners'
import { OwnerDetailsSheet } from '../sheets/owner/details'
import { EditOwnerSheet } from '../sheets/owner/edit'

interface ActionsProps {
  owner: OwnerWithRelations
}

export function OwnersTableActions({ owner }: ActionsProps) {
  const ownerFullName = `${owner.firstName} ${owner.lastName}`.trim()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isOwnerDetailsSheetOpen, setIsOwnerDetailsSheetOpen] = useState(false)
  const [isEditOwnerSheetOpen, setIsEditOwnerSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteOwnerMutation = useMutation({
    mutationFn: async (data: DeleteOwnerData) => {
      return await deleteOwner({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      setIsDeleteDialogOpen(false)
      toast.success('Propietario eliminado exitosamente.')
    },
    onError: () => {
      toast.error('Ocurrió un error al eliminar el propietario, intenta nuevamente.')
    },
  })

  function handleDeleteOwner() {
    deleteOwnerMutation.mutate({ ownerId: owner.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>¿Eliminar propietario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{ownerFullName}</strong>. Esta acción no se puede deshacer.
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

      <OwnerDetailsSheet
        owner={owner}
        state={{ isOpen: isOwnerDetailsSheetOpen, onOpenChange: setIsOwnerDetailsSheetOpen }}
      />

      <EditOwnerSheet
        owner={owner}
        state={{ isOpen: isEditOwnerSheetOpen, onOpenChange: setIsEditOwnerSheetOpen }}
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
              {ownerFullName}
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={() => setIsOwnerDetailsSheetOpen(true)}>
              <IconUser className="size-4" />
              Información
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setIsEditOwnerSheetOpen(true)}>
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
