import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { boardMembersQueryOptions } from '@/tanstack-queries/hoa-board'
import { type BoardViewer, boardMembersTableColumns } from './columns'
import { BoardMembersDataTableHeader } from './data-table-header'

interface BoardMembersDataTableProps {
  viewer: BoardViewer
}

export function BoardMembersDataTable({ viewer }: BoardMembersDataTableProps) {
  const { data: members = [], isLoading, error, refetch } = useQuery(boardMembersQueryOptions())
  const columns = useMemo(() => boardMembersTableColumns(viewer), [viewer])

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={members}
      tableId="board"
      columns={columns}
      getRowId={(member) => member.id}
      initialSorting={[{ id: 'full_name', desc: false }]}
      header={(table) => <BoardMembersDataTableHeader table={table} viewer={viewer} isLoading={isLoading} />}
      emptyMessage="Sin integrantes."
      isLoading={isLoading}
    />
  )
}
