import { IconDotsVertical, IconEdit, IconFlag, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteViolation } from '@/api/server-functions/violations'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
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
import type { ViolationWithOwner } from '@/db/schemas/zod/violations'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { DeleteViolationData } from '@/schemas/violations'
import { EditViolationSheet } from '../sheets/edit-violation'
import { ViolationDetailsSheet } from '../sheets/violation-details'

interface ActionsProps {
  violation: ViolationWithOwner
}

export function ViolationsTableActions({ violation }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isViolationDetailsSheetOpen, setViolationDetailsSheetOpen] = useState(false)
  const [isEditViolationSheetOpen, setEditViolationSheetOpen] = useState(false)

  const deleteViolationMutation = useEntityMutation({
    mutationFn: async (data: DeleteViolationData) => {
      return await deleteViolation({ data })
    },
    invalidateKeys: [VIOLATIONS_QUERY_KEY],
    successTitle: 'Infracción eliminada',
    successDescription: 'La infracción ha sido eliminada exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar la infracción, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
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
                <IconFlag className="size-4" />
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
