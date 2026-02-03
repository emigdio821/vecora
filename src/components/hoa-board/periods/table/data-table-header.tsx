import { IconPlus, IconSearch } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import type { HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'
import { CreatePeriodSheet } from '../sheets/create-period'

interface PeriodsDataTableHeaderProps {
  table: Table<HoaBoardPeriodWithMembers>
}

export function PeriodsDataTableHeader({ table }: PeriodsDataTableHeaderProps) {
  const [searchQuery, setSearchQuery] = useQueryState(
    'search-hoa-board-periods',
    parseAsString.withDefault(''),
  )
  const tableRowsLength = table.getCoreRowModel().rows.length
  const [isCreatePeriodSheetOpen, setIsCreatePeriodSheetOpen] = useState(false)

  useEffect(() => {
    table.getColumn('startDate')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-external-users"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value || null)}
          />
          <InputGroupAddon>
            <IconSearch className="size-4" />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          <Button className="ml-auto" onClick={() => setIsCreatePeriodSheetOpen(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>

      <CreatePeriodSheet
        state={{
          isOpen: isCreatePeriodSheetOpen,
          onOpenChange: setIsCreatePeriodSheetOpen,
        }}
      />
    </>
  )
}
