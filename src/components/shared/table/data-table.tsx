'use client'

import type {
  ColumnDef,
  PaginationState,
  RowData,
  SortingState,
  Table as TableType,
} from '@tanstack/react-table'
import { flexRender, functionalUpdate, useTable } from '@tanstack/react-table'
import { TriangleAlertIcon } from 'lucide-react'
import { parseAsIndex, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CardFrame, CardFrameFooter } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DataTableFeatures } from './features'
import { dataTableFeatures } from './features'

interface DataTableProps<TData extends RowData> {
  data: TData[]
  columns: ColumnDef<DataTableFeatures, TData>[]
  /** Toolbar rendered above the table (search, bulk actions, create button…). */
  header?: (table: TableType<DataTableFeatures, TData>) => React.ReactNode
  initialSorting?: SortingState
  pageSize?: number
  /** Stable row id (recommended when rows can be selected). Defaults to row index. */
  getRowId?: (row: TData) => string
  /**
   * Namespaces the URL query param that stores the current page
   * (`?page=2` without it, `?residents-page=2` with `tableId="residents"`).
   * Required when two tables share a route.
   */
  tableId?: string
  emptyMessage?: string
  className?: string
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  header,
  initialSorting = [],
  pageSize: initialPageSize = 10,
  getRowId,
  tableId,
  emptyMessage = 'Sin resultados.',
  className,
}: DataTableProps<TData>) {
  // Page lives in the URL (1-based there, 0-based here) so a refresh keeps it.
  const [pageIndex, setPageIndex] = useQueryState(
    tableId ? `${tableId}-page` : 'page',
    parseAsIndex.withDefault(0),
  )
  const [pageSize, setPageSize] = useState(initialPageSize)
  const pagination: PaginationState = { pageIndex, pageSize }

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    enableSortingRemoval: false,
    // Off: the default resets to page 1 every time `data` changes, which
    // TanStack Query does on every refetch. We reset on filter changes below.
    autoResetPageIndex: false,
    state: { pagination },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination)
      if (next.pageSize !== pagination.pageSize) setPageSize(next.pageSize)
      if (next.pageIndex !== pagination.pageIndex) void setPageIndex(next.pageIndex)
    },
    initialState: { sorting: initialSorting },
  })

  // Back to page 1 when the filters change (but not on first render, so the
  // URL page survives a refresh).
  const filtersKey = JSON.stringify(table.state.columnFilters)
  const previousFiltersKey = useRef(filtersKey)
  useEffect(() => {
    if (previousFiltersKey.current !== filtersKey) {
      previousFiltersKey.current = filtersKey
      void setPageIndex(0)
    }
  }, [filtersKey, setPageIndex])

  const rows = table.getRowModel().rows
  const rowCount = table.getRowCount()
  const pageCount = table.getPageCount()
  const isPageOutOfRange = pageCount > 0 && pageIndex >= pageCount

  const pageRanges = Array.from({ length: pageCount }, (_, i) => ({
    value: i + 1,
    label: `${i * pageSize + 1}-${Math.min((i + 1) * pageSize, rowCount)}`,
  }))

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {header?.(table)}

      {isPageOutOfRange ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Página fuera de rango</EmptyTitle>
            <EmptyDescription>
              La página <span className="font-semibold">{pageIndex + 1}</span> no existe en esta tabla. La
              última página es <span className="font-semibold">{pageCount}</span>.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => table.setPageIndex(0)}>Ir a la primera página</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <CardFrame className="w-full">
          <Table variant="card" className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: `${header.column.getSize()}px` }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow data-state={row.getIsSelected() ? 'selected' : undefined} key={row.id}>
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
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {rowCount > 0 && (
            <CardFrameFooter className="p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <p className="text-sm text-muted-foreground">Mostrando</p>
                  <Select
                    items={pageRanges}
                    value={pageIndex + 1}
                    onValueChange={(value) => table.setPageIndex((value as number) - 1)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="min-w-none w-fit"
                      aria-label="Seleccionar rango de resultados"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {pageRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    de <strong className="font-medium text-foreground">{rowCount}</strong> resultados
                  </p>
                </div>

                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        className="sm:*:[svg]:hidden"
                        render={
                          <Button
                            size="sm"
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => table.previousPage()}
                            variant="outline"
                          />
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        className="sm:*:[svg]:hidden"
                        render={
                          <Button
                            size="sm"
                            disabled={!table.getCanNextPage()}
                            onClick={() => table.nextPage()}
                            variant="outline"
                          />
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardFrameFooter>
          )}
        </CardFrame>
      )}
    </div>
  )
}
