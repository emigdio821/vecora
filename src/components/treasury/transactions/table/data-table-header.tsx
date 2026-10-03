import { IconFilter, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/components/ui/menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { TransactionQueryData } from '@/tanstack-queries/treasury'
import { DeleteTransactionsAlertDialog } from '../dialog/delete-transactions'
import { CreateTransactionDrawer } from '../drawer/create-transaction'
import { RecordFeeDrawer } from '../drawer/record-fee'

export const KIND_FILTERS = ['all', 'income', 'expense'] as const
export type KindFilter = (typeof KIND_FILTERS)[number]

const KIND_FILTER_ITEMS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
]

/** URL-backed kind filter, shared by the header (control) and the table (data). */
export function useKindFilter() {
  return useQueryState('kind', parseAsStringLiteral(KIND_FILTERS).withDefault('all'))
}

interface TransactionsDataTableHeaderProps {
  table: Table<DataTableFeatures, TransactionQueryData>
}

export function TransactionsDataTableHeader({ table }: TransactionsDataTableHeaderProps) {
  const canManage = useHasRole('treasurer')
  const [kind, setKind] = useKindFilter()
  const isFiltered = kind !== 'all'
  const activeKindLabel = KIND_FILTER_ITEMS.find((item) => item.value === kind)?.label
  const [isRecordFeeOpen, setRecordFeeOpen] = useState(false)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isDeleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedTransactions = selectedRows.map((row) => row.original)

  return (
    <>
      <RecordFeeDrawer open={isRecordFeeOpen} onOpenChange={setRecordFeeOpen} />
      <CreateTransactionDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />
      <DeleteTransactionsAlertDialog
        transactions={selectedTransactions}
        open={isDeleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        onDeleted={() => {
          table.resetRowSelection()
        }}
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="description"
            param="search-transactions"
            hint="Buscar por concepto, folio, referencia, categoría o casa"
          />

          <Menu>
            <Tooltip>
              <TooltipTrigger
                closeOnClick={false}
                render={
                  <MenuTrigger
                    render={
                      <Button
                        size="icon"
                        variant="outline"
                        className="relative"
                        aria-label={isFiltered ? `Filtros: ${activeKindLabel}` : 'Filtros'}
                      >
                        <IconFilter className="size-4" />
                        {/* The list is narrowed; don't let that go unnoticed. */}
                        {isFiltered && (
                          <span
                            aria-hidden
                            className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-background bg-primary"
                          />
                        )}
                      </Button>
                    }
                  />
                }
              />
              <TooltipContent>{isFiltered ? `Filtros: ${activeKindLabel}` : 'Filtros'}</TooltipContent>
            </Tooltip>

            <MenuPopup align="end">
              <MenuGroup>
                <MenuGroupLabel>Tipo de movimiento</MenuGroupLabel>
                <MenuRadioGroup
                  value={kind}
                  onValueChange={(value: KindFilter) => {
                    void setKind(value)
                  }}
                >
                  {KIND_FILTER_ITEMS.map((item) => (
                    <MenuRadioItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
            </MenuPopup>
          </Menu>
        </div>

        {canManage && (
          <div className="flex flex-wrap justify-end gap-2">
            {selectedRowsLength > 0 && (
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <Button
                      variant="destructive-outline"
                      aria-label={`Eliminar ${selectedRowsLength} movimientos seleccionados`}
                      onClick={() => {
                        setDeleteSelectedOpen(true)
                      }}
                    >
                      <IconTrash className="size-4" />
                      <Badge variant="error" size="sm" aria-hidden>
                        {selectedRowsLength}
                      </Badge>
                    </Button>
                  }
                />
                <TooltipContent>Eliminar movimientos seleccionados</TooltipContent>
              </Tooltip>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(true)
              }}
            >
              Registrar movimiento
            </Button>
            <Button
              onClick={() => {
                setRecordFeeOpen(true)
              }}
            >
              Registrar cuota
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
