import type { Table } from '@tanstack/react-table'
import { SearchIcon, XIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import type { PeriodQueryData } from '@/tanstack-queries/treasury'
import { CreatePeriodDrawer } from '../drawer/create-period'
import type { PeriodRow } from './columns'

interface PeriodsDataTableHeaderProps {
  table: Table<DataTableFeatures, PeriodRow>
  /** Newest period, if any; seeds the "Nuevo periodo" form. */
  latest: PeriodQueryData | undefined
}

export function PeriodsDataTableHeader({ table, latest }: PeriodsDataTableHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-periods', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreatePeriodDrawer latest={latest} open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-2xs md:w-xs xl:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            ref={searchInputRef}
            name="search-periods"
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
        </InputGroup>

        <Button onClick={() => setCreateOpen(true)}>Nuevo periodo</Button>
      </div>
    </>
  )
}
