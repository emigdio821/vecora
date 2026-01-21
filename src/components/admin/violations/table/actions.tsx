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
import type { ViolationWithOwner } from '@/db/schemas/zod'
import { VIOLATIONS_LIST_QUERY_KEY } from '@/lib/ts-queries/violations'
import { type DeleteViolationData, deleteViolation } from '@/server-fns/violations'
import { EditViolationSheet } from '../sheets/edit-violation'
import { ViolationDetailsSheet } from '../sheets/violation-details'

interface ActionsProps {
  violation: ViolationWithOwner
}

export function ViolationsTableActions({ violation }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isViolationDetailsSheetOpen, setViolationDetailsSheetOpen] = useState(false)
  const [isEditViolationSheetOpen, setEditViolationSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteViolationMutation = useMutation({
    mutationFn: async (data: DeleteViolationData) => {
      return await deleteViolation({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VIOLATIONS_LIST_QUERY_KEY] })
      setDeleteDialogOpen(false)
      toastManager.add({
        type: 'success',
        title: 'Infracción eliminada',
        description: 'La infracción ha sido eliminada exitosamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting violation:', error)

      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al eliminar la infracción, intenta nuevamente.',
      })
    },
  })

  function handleDeleteViolation() {
    deleteViolationMutation.mutate({ violationId: violation.id })
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar infracción?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la infracción <strong>{violation.concept}</strong>. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={deleteViolationMutation.isPending} />}
            >
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleDeleteViolation}
                  disabled={deleteViolationMutation.isPending}
                />
              }
            >
              Eliminar
              {deleteViolationMutation.isPending && <LoaderIcon />}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      <ViolationDetailsSheet
        violation={violation}
        state={{ isOpen: isViolationDetailsSheetOpen, onOpenChange: setViolationDetailsSheetOpen }}
      />

      <EditViolationSheet
        violation={violation}
        state={{ isOpen: isEditViolationSheetOpen, onOpenChange: setEditViolationSheetOpen }}
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
                {violation.concept}
              </MenuGroupLabel>

              <MenuItem onClick={() => setViolationDetailsSheetOpen(true)}>
                <IconUser className="size-4" />
                Información
              </MenuItem>

              <MenuItem onClick={() => setEditViolationSheetOpen(true)}>
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
