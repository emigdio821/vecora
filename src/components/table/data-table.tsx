import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as TableType,
  useReactTable,
} from '@tanstack/react-table'
import { parseAsIndex, parseAsInteger, useQueryStates } from 'nuqs'
import { useEffect, useState } from 'react'
import { DataTablePagination, DEFAULT_TABLE_PAGE_SIZE } from '@/components/table/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  data: TData[]
  tableId?: string
  withSelection?: boolean
  columns: ColumnDef<TData, TValue>[]
  header?: (table: TableType<TData>) => React.ReactNode
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { data, tableId, header, columns, withSelection = true } = props

  const paginationUrlKeys = {
    pageIndex: tableId ? `${tableId}-page` : 'page',
    pageSize: tableId ? `${tableId}-perPage` : 'perPage',
  }

  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const paginationParsers = {
    pageIndex: parseAsIndex.withDefault(0),
    pageSize: parseAsInteger.withDefault(DEFAULT_TABLE_PAGE_SIZE),
  }

  const [{ pageIndex, pageSize }, setPagination] = useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys,
  })

  const table = useReactTable({
    data,
    columns,
    // onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater
      setPagination(newPagination)
    },
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    state: {
      // sorting,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    initialState: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  })

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(data.length / pageSize) - 1)
    if (pageIndex > maxPage) {
      setPagination({ pageIndex: maxPage, pageSize })
    }
  }, [data.length, pageIndex, pageSize, setPagination])

  return (
    <div className="space-y-4">
      {header?.(table)}

      <div className="overflow-clip rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} withSelection={withSelection} />
    </div>
  )
}
