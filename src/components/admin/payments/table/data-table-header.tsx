import { IconFileExport, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { deletePayment } from '@/api/server-functions/payments'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PAYMENTS_QUERY_KEY } from '@/api/tanstack-queries/payments'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PaymentWithOwnerAndMonths } from '@/db/schema/zod/payments'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { CreatePaymentSheet } from '../sheets/create-payment'

interface PaymentsDataTableHeaderProps {
  table: Table<PaymentWithOwnerAndMonths>
}

export function PaymentsDataTableHeader({ table }: PaymentsDataTableHeaderProps) {
  const [openCreatePaymentDialog, setOpenCreatePaymentDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-payments', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  const bulkDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Propietarios eliminados',
    successDescription: 'Los propietarios seleccionadas han sido eliminados exitosamente.',
    deleteFn: async (payment) => {
      await deletePayment({ data: { paymentId: payment.id } })
    },
    invalidateKeys: [PAYMENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleBatchDelete() {
    await bulkDeleteMutation.mutateAsync()
  }

  useEffect(() => {
    table.getColumn('amount')?.setFilterValue(searchQuery)
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
        title="¿Eliminar pagos?"
        description={
          <div>
            <p>
              Pagos seleccionados: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }
      />

      <CreatePaymentSheet
        state={{ isOpen: openCreatePaymentDialog, onOpenChange: setOpenCreatePaymentDialog }}
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-payments"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value || null)}
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
              <TooltipContent>Buscar por monto o propietario</TooltipContent>
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
                    aria-label="Borrar pagos seleccionados"
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

          <Button onClick={() => setOpenCreatePaymentDialog(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>
    </>
  )
}
