import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteResident } from '@/api/server-functions/residents'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { RESIDENTS_QUERY_KEY, type ResidentQueryData } from '@/api/tanstack-queries/residents'
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
import type { DeleteResidentData } from '@/schemas/residents'
import { EditResidentSheet } from '../sheets/edit-resident'
import { ResidentDetailsSheet } from '../sheets/resident-details'

interface ActionsProps {
  resident: ResidentQueryData
}

export function ResidentsTableActions({ resident }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isResidentDetailsSheetOpen, setResidentDetailsSheetOpen] = useState(false)
  const [isEditResidentSheetOpen, setEditResidentSheetOpen] = useState(false)

  const deleteResidentMutation = useEntityMutation({
    mutationFn: async (data: DeleteResidentData) => {
      return await deleteResident({ data })
    },
    invalidateKeys: [RESIDENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Residente eliminado',
    successDescription: 'El residente ha sido eliminado exitosamente',
    errorDescription: 'Ocurrió un error al eliminar el residente, intenta nuevamente',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleDeleteResident() {
    deleteResidentMutation.mutate({ residentId: resident.id })
  }

  const residentFullName = `${resident.firstName} ${resident.lastName}`

  return (
    <>
      <AlertDialogGeneric
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        action={handleDeleteResident}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar residente?"
        description={
          <div>
            Estás por eliminar a <strong>{residentFullName}</strong>. Esta acción no se puede deshacer.
          </div>
        }
      />

      <ResidentDetailsSheet
        resident={resident}
        open={isResidentDetailsSheetOpen}
        onOpenChange={setResidentDetailsSheetOpen}
      />

      <EditResidentSheet
        resident={resident}
        open={isEditResidentSheetOpen}
        onOpenChange={setEditResidentSheetOpen}
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
                {residentFullName}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setResidentDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditResidentSheetOpen(true)}>
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
