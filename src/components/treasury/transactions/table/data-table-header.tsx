import type { Table } from '@tanstack/react-table'
import { InfoIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { RadioGroupPrimitive, RadioPrimitive } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { segmentedControlItemVariants, segmentedControlRootClassName } from '@/lib/segmented-control'
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

const kindFilterItemClassName = segmentedControlItemVariants({ state: 'checked' })

/** URL-backed kind filter, shared by the header (control) and the table (data). */
export function useKindFilter() {
  return useQueryState('kind', parseAsStringLiteral(KIND_FILTERS).withDefault('all'))
}

interface TransactionsDataTableHeaderProps {
  table: Table<DataTableFeatures, TransactionQueryData>
}

export function TransactionsDataTableHeader({ table }: TransactionsDataTableHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-transactions', parseAsString.withDefault(''))
  const [kind, setKind] = useKindFilter()
  const [isRecordFeeOpen, setRecordFeeOpen] = useState(false)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isDeleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedTransactions = selectedRows.map((row) => row.original)

  useEffect(() => {
    table.getColumn('description')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <RecordFeeDrawer open={isRecordFeeOpen} onOpenChange={setRecordFeeOpen} />
      <CreateTransactionDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />
      <DeleteTransactionsAlertDialog
        transactions={selectedTransactions}
        open={isDeleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        onDeleted={() => table.resetRowSelection()}
      />

      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-2xs md:w-xs xl:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            ref={searchInputRef}
            name="search-transactions"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>

          {searchQuery && (
            <InputGroupAddon align="inline-end">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  searchInputRef.current?.focus()
                  void setSearchQuery('')
                }}
              >
                <XIcon aria-hidden />
              </Button>
            </InputGroupAddon>
          )}

          <InputGroupAddon align="inline-end">
            <Tooltip open={isSearchTooltipOpen} onOpenChange={setSearchTooltipOpen}>
              <TooltipTrigger
                closeOnClick={false}
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="cursor-default"
                    onClick={() => {
                      setSearchTooltipOpen(true)
                    }}
                  >
                    <InfoIcon className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Buscar por concepto, folio, referencia, categoría o casa</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-wrap justify-end gap-2">
          <RadioGroupPrimitive
            className={segmentedControlRootClassName}
            aria-label="Tipo de movimiento"
            value={kind}
            onValueChange={(value) => void setKind(value as KindFilter)}
          >
            {KIND_FILTER_ITEMS.map((item) => (
              <RadioPrimitive.Root key={item.value} className={kindFilterItemClassName} value={item.value}>
                {item.label}
              </RadioPrimitive.Root>
            ))}
          </RadioGroupPrimitive>

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
                    <Trash2Icon className="size-4" />
                    <Badge variant="error" size="sm" aria-hidden>
                      {selectedRowsLength}
                    </Badge>
                  </Button>
                }
              />
              <TooltipContent>Eliminar movimientos seleccionados</TooltipContent>
            </Tooltip>
          )}

          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            Registrar movimiento
          </Button>
          <Button onClick={() => setRecordFeeOpen(true)}>Registrar cuota</Button>
        </div>
      </div>
    </>
  )
}
