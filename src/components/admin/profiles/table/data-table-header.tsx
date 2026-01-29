import type { Table } from '@tanstack/react-table'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'

interface ProfilesDataTableHeaderProps {
  table: Table<ProfileWithAllRelations>
}

export function ProfilesDataTableHeader({ table: _ }: ProfilesDataTableHeaderProps) {
  return <></>
}
