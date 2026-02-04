import { IconFileExport, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { deleteHoaBoardMember } from '@/api/server-functions/hoa-board'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOA_BOARD_MEMBERS_QUERY_KEY, HOA_BOARD_PERIODS_QUERY_KEY } from '@/api/tanstack-queries/hoa-board'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { HoaBoardMember } from '@/db/schemas/zod/hoa-board'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { useUserRoles } from '@/hooks/use-user-roles'
import { CreateMemberSheet } from '../sheets/create-member'

interface MembersDataTableHeaderProps {
  table: Table<HoaBoardMember>
}

export function MembersDataTableHeader({ table }: MembersDataTableHeaderProps) {
  const [isCreateMemberSheetOpen, setIsCreateMemberSheetOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-hoa-members', parseAsString.withDefault(''))

  const { isAdmin } = useUserRoles()

  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  const bulkDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Miembros eliminados',
    successDescription: 'Los miembros seleccionados han sido eliminados exitosamente.',
    deleteFn: async (member) => {
      await deleteHoaBoardMember({ data: { memberId: member.id } })
    },
    invalidateKeys: [HOA_BOARD_PERIODS_QUERY_KEY, HOA_BOARD_MEMBERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleBatchDelete() {
    await bulkDeleteMutation.mutateAsync()
  }

  useEffect(() => {
    table.getColumn('firstName')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <AlertDialogGeneric
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={handleBatchDelete}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar miembros?"
        description={
          <div>
            <p>
              Miembros seleccionados: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }
      />

      <CreateMemberSheet
        state={{
          isOpen: isCreateMemberSheetOpen,
          onOpenChange: setIsCreateMemberSheetOpen,
        }}
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <IconSearch className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          {isAdmin && selectedRowsLength > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" size="icon">
                    <IconTrash />
                  </Button>
                }
              />
              <TooltipContent>Eliminar miembros seleccionados</TooltipContent>
            </Tooltip>
          )}

          {tableRowsLength > 0 && (
            <Button variant="outline" disabled>
              <IconFileExport className="size-4" />
              <span>Exportar</span>
              {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
            </Button>
          )}

          {isAdmin && (
            <Button onClick={() => setIsCreateMemberSheetOpen(true)}>
              <IconPlus className="size-4" />
              Agregar
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
