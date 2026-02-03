import { IconPlus } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
// import { parseAsString, useQueryState } from 'nuqs'
// import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
// import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import type { HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'

interface PeriodsDataTableHeaderProps {
  table: Table<HoaBoardPeriodWithMembers>
}

export function PeriodsDataTableHeader({ table: _ }: PeriodsDataTableHeaderProps) {
  // const [searchQuery, setSearchQuery] = useQueryState('search-periods', parseAsString.withDefault(''))
  // const tableRowsLength = table.getCoreRowModel().rows.length

  // useEffect(() => {
  //   table.getColumn('startDate')?.setFilterValue(searchQuery)
  // }, [searchQuery, table])

  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row">
      {/* <InputGroup className="w-full bg-background sm:w-sm">
        <InputGroupInput
          type="search"
          value={searchQuery}
          aria-label="Buscar"
          disabled={tableRowsLength === 0}
          placeholder="Buscar periodos..."
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon>
          <IconSearch className="size-4" />
        </InputGroupAddon>
      </InputGroup> */}

      <div className="flex w-full gap-2">
        <Button className="ml-auto" disabled>
          <IconPlus className="size-4" />
          Crear
        </Button>
      </div>
    </div>
  )
}
