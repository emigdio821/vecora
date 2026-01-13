import { IconSearch } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import type { OwnerWithRelations } from '@/db/schemas/zod'

interface OwnersDataTableHeaderProps {
  table: Table<OwnerWithRelations>
}

export function OwnersDataTableHeader(_props: OwnersDataTableHeaderProps) {
  return (
    <InputGroup className="w-full sm:w-sm">
      <InputGroupAddon align="inline-start">
        <IconSearch className="size-4" />
      </InputGroupAddon>

      <InputGroupInput name="search-owner" placeholder="Buscar propietarios" />
    </InputGroup>
  )
}
