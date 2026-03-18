import { IconFileExport, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { deleteViolation, type ViolationQueryData } from '@/api/server-functions/violations'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { VIOLATIONS_QUERY_KEY } from '@/api/tanstack-queries/violations'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { useDebouncedSearchQuery } from '@/hooks/use-debounced-search-query'
import { CreateViolationSheet } from '../sheets/create-violation'

interface ViolationsDataTableHeaderProps {
  table: Table<ViolationQueryData>
}

export function ViolationsDataTableHeader({ table }: ViolationsDataTableHeaderProps) {
  const [openCreateViolationDialog, setOpenCreateViolationDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery, debouncedSearch] = useDebouncedSearchQuery('search-violations')
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  const bulkDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Infracciones eliminadas',
    successDescription: 'Las infracciones seleccionadas han sido eliminadas exitosamente',
    deleteFn: async (violation) => {
      await deleteViolation({ data: { violationId: violation.id } })
    },
    invalidateKeys: [VIOLATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleBatchDelete() {
    await bulkDeleteMutation.mutateAsync()
  }

  useEffect(() => {
    table.getColumn('concept')?.setFilterValue(debouncedSearch)
  }, [debouncedSearch, table])

  return (
    <>
      <AlertDialogGeneric
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        action={handleBatchDelete}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar infracciones?"
        description={
          <div>
            <p>
              Infracciones seleccionadas: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }
      />

      <CreateViolationSheet open={openCreateViolationDialog} onOpenChange={setOpenCreateViolationDialog} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-violations"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>

          <InputGroupAddon align="inline-end">
            <Tooltip open={isSearchTooltipOpen} onOpenChange={setSearchTooltipOpen}>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="cursor-default"
                    onClick={(e) => {
                      e.preventBaseUIHandler()
                      setSearchTooltipOpen(true)
                    }}
                  >
                    <IconInfoCircle className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Buscar por concepto o propietario</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          {selectedRowsLength > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon"
                    variant="destructive"
                    aria-label="Borrar infracciones seleccionadas"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Eliminar seleccionados</TooltipContent>
            </Tooltip>
          )}

          {tableRowsLength > 0 && (
            <Button variant="outline" disabled>
              <IconFileExport className="size-4" />
              <span>Exportar</span>
              {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
            </Button>
          )}

          <Button onClick={() => setOpenCreateViolationDialog(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>
    </>
  )
}
