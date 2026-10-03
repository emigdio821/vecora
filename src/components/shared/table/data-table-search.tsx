import { IconInfoCircle, IconSearch, IconX } from '@tabler/icons-react'
import type { RowData, Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { DataTableFeatures } from './features'

interface DataTableSearchProps<TData extends RowData> {
  table: Table<DataTableFeatures, TData>
  /** The column whose filter function does the matching. */
  columnId: string
  /** URL query param that keeps the text, e.g. "search-houses". */
  param: string
  /** What the search looks at, shown in the info tooltip. */
  hint: string
  className?: string
}

/**
 * The search box above a table: kept in the URL, fed to one column's filter.
 * Goes in a flex row (with the filters button, if any): it fills that row on
 * phones and has a fixed width from `sm` up.
 */
export function DataTableSearch<TData extends RowData>({
  table,
  columnId,
  param,
  hint,
  className,
}: DataTableSearchProps<TData>) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isHintOpen, setHintOpen] = useState(false)
  const [query, setQuery] = useQueryState(param, parseAsString.withDefault(''))
  const isEmpty = table.getCoreRowModel().rows.length === 0

  useEffect(() => {
    table.getColumn(columnId)?.setFilterValue(query)
  }, [query, columnId, table])

  return (
    <InputGroup
      className={cn('min-w-0 flex-1 bg-background sm:w-2xs sm:flex-none md:w-xs xl:w-sm', className)}
    >
      <InputGroupInput
        type="search"
        value={query}
        aria-label="Buscar"
        placeholder="Buscar"
        ref={inputRef}
        name={param}
        disabled={isEmpty}
        onChange={(e) => {
          void setQuery(e.target.value)
        }}
      />
      <InputGroupAddon>
        <IconSearch />
      </InputGroupAddon>

      {query && (
        <InputGroupAddon align="inline-end">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              inputRef.current?.focus()
              void setQuery('')
            }}
          >
            <IconX aria-hidden />
          </Button>
        </InputGroupAddon>
      )}

      <InputGroupAddon align="inline-end">
        <Tooltip open={isHintOpen} onOpenChange={setHintOpen}>
          <TooltipTrigger
            closeOnClick={false}
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                className="cursor-default"
                aria-label={hint}
                onClick={() => {
                  setHintOpen(true)
                }}
              >
                <IconInfoCircle className="size-4" />
              </Button>
            }
          />
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}
