import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteOwner } from '@/api/server-functions/owners'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { OWNERS_QUERY_KEY } from '@/api/tanstack-queries/owners'
import { LoaderIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { DeleteOwnerData } from '@/schemas/owners'
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

  const deleteOwnerMutation = useEntityMutation({
    mutationFn: async (data: DeleteOwnerData) => {
      return await deleteOwner({ data })
    },
    invalidateKeys: [OWNERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Propietario eliminado',
    successDescription: 'El propietario ha sido eliminado exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar el propietario, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleDeleteOwner() {
    deleteOwnerMutation.mutate({ ownerId: owner.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propietario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar a <strong>{ownerFullName}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" disabled={deleteOwnerMutation.isPending} />}>
              Cancelar
            </AlertDialogCancel>
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
        state={{ isOpen: isOwnerDetailsSheetOpen, onOpenChange: setOwnerDetailsSheetOpen }}
      />

      <EditOwnerSheet
        owner={owner}
        state={{ isOpen: isEditOwnerSheetOpen, onOpenChange: setEditOwnerSheetOpen }}
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
                {ownerFullName}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setOwnerDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditOwnerSheetOpen(true)}>
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
