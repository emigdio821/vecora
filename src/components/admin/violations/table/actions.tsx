import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteViolation } from '@/api/server-functions/violations'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
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
import type { ViolationWithOwner } from '@/db/schema/zod/violations'
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
    invalidateKeys: [VIOLATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
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
      <AlertDialogGeneric
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={handleDeleteViolation}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar infracción?"
        description={
          <p>
            Estás por eliminar la infracción <strong>{violation.concept}</strong>. Esta acción no se puede
            deshacer.
          </p>
        }
      />

      <ViolationDetailsSheet
        violation={violation}
        state={{ isOpen: isViolationDetailsSheetOpen, onOpenChange: setViolationDetailsSheetOpen }}
      />

      <EditViolationSheet
        violation={violation}
        state={{ isOpen: isEditViolationSheetOpen, onOpenChange: setEditViolationSheetOpen }}
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
                {violation.concept}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setViolationDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditViolationSheetOpen(true)}>
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
