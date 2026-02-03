import { IconPlus, IconSearch } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import type { HoaBoardMemberWithProfile } from '@/db/schemas/zod/hoa-board'

interface MembersDataTableHeaderProps {
  table: Table<HoaBoardMemberWithProfile>
}

export function MembersDataTableHeader({ table }: MembersDataTableHeaderProps) {
  const [searchQuery, setSearchQuery] = useQueryState('search-hoa-members', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length

  useEffect(() => {
    table.getColumn('firstName')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
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
        <Button disabled>
          <IconPlus className="size-4" />
          Agregar
        </Button>
      </div>
    </div>
  )
}
