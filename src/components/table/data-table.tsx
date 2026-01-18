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
import { Frame, FrameFooter, FrameHeader } from '../ui/frame'

interface DataTableProps<TData, TValue> {
  data: TData[]
  tableId?: string
  columns: ColumnDef<TData, TValue>[]
  header?: (table: TableType<TData>) => React.ReactNode
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { data, tableId, header, columns } = props

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

  const rowLength = table.getFilteredRowModel().rows.length

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(data.length / pageSize) - 1)
    if (pageIndex > maxPage) {
      setPagination({ pageIndex: maxPage, pageSize })
    }
  }, [data.length, pageIndex, pageSize, setPagination])

  return (
    <Frame className="w-full">
      {header && <FrameHeader className="p-2">{header(table)}</FrameHeader>}

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
              <TableRow data-state={row.getIsSelected() && 'selected'} key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={columns.length}>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {rowLength > DEFAULT_TABLE_PAGE_SIZE && (
        <FrameFooter className="p-2">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <DataTablePagination table={table} />
          </div>
        </FrameFooter>
      )}
    </Frame>
  )
}
