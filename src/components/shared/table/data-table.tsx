import type {
  ColumnDef,
  PaginationState,
  RowData,
  SortingState,
  Table as TableType,
} from '@tanstack/react-table'
import { flexRender, functionalUpdate, useTable } from '@tanstack/react-table'
import { parseAsIndex, useQueryState } from 'nuqs'
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CardFrame, CardFrameFooter } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'
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
  emptyMessage?: ReactNode
  /** Skeleton rows in the body while the header and column titles stay usable. */
  isLoading?: boolean
  className?: string
}

const LOADING_ROWS = 10

// Shaped like the real checkbox and actions button, so rows don't jump when the data lands.
const LOADING_CELL_CLASS: Record<string, string> = {
  // Inline like the checkbox, so it sits on the same line box (a block lands 1px lower).
  select: 'inline-flex size-4.5 rounded-[.25rem] sm:size-4',
  actions: 'ms-auto size-9 rounded-lg sm:size-8',
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  header,
  initialSorting = [],
  pageSize: initialPageSize = 10,
  getRowId,
  tableId,
  emptyMessage = m.common_no_results(),
  isLoading = false,
  className,
}: DataTableProps<TData>) {
  // Page lives in the URL (1-based there, 0-based here) so a refresh keeps it.
  const [pageIndex, setPageIndex] = useQueryState(
    tableId ? `${tableId}-page` : 'page',
    parseAsIndex.withDefault(0),
  )
  const [pageSize, setPageSize] = useState(initialPageSize)
  const pagination: PaginationState = { pageIndex, pageSize }
  const clampedFrom = useRef<number | null>(null)

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    enableSortingRemoval: false,
    // Off: the default resets to page 1 every time `data` changes, which
    // TanStack Query does on every refetch. The search box and the filter
    // menus go back to page 1 themselves, when the user changes them.
    autoResetPageIndex: false,
    state: { pagination },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination)
      clampedFrom.current = null
      if (next.pageSize !== pagination.pageSize) setPageSize(next.pageSize)
      if (next.pageIndex !== pagination.pageIndex) void setPageIndex(next.pageIndex)
    },
    initialState: { sorting: initialSorting },
  })

  const rows = table.getRowModel().rows
  const rowCount = table.getRowCount()
  const pageCount = table.getPageCount()
  const isPageOutOfRange = pageCount > 0 && pageIndex >= pageCount
  const isSinglePage = pageCount <= 1

  useLayoutEffect(() => {
    if (isPageOutOfRange) {
      clampedFrom.current = clampedFrom.current ?? pageIndex
      void setPageIndex(pageCount - 1)
    } else if (clampedFrom.current !== null && clampedFrom.current < pageCount) {
      void setPageIndex(clampedFrom.current)
      clampedFrom.current = null
    }
  }, [isPageOutOfRange, pageCount, pageIndex, setPageIndex])

  const pageRanges = Array.from({ length: pageCount }, (_, i) => ({
    value: i + 1,
    label: `${i * pageSize + 1}-${Math.min((i + 1) * pageSize, rowCount)}`,
  }))

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {header?.(table)}

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
            {isLoading &&
              Array.from({ length: LOADING_ROWS }, (_, index) => (
                <TableRow className="hover:bg-transparent" key={index}>
                  {table.getVisibleLeafColumns().map((column) => (
                    <TableCell
                      key={column.id}
                      // A real checkbox cell narrows itself via `has-[[role=checkbox]]`; the skeleton
                      // isn't one, so spell that out or the columns shift when the data lands.
                      className={cn(column.id === 'select' && 'w-px first:pe-0 last:ps-0')}
                    >
                      <Skeleton className={LOADING_CELL_CLASS[column.id] ?? 'h-4.5 w-full max-w-32'} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              (rows.length ? (
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
                    {/* Rows that the search hides aren't an empty section. */}
                    {table.getCoreRowModel().rows.length > 0 ? m.common_no_results() : emptyMessage}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {rowCount > 0 && (
          <CardFrameFooter className="p-2">
            {/* min-h keeps the footer height when the buttons are hidden. */}
            <div className="flex min-h-8 items-center justify-between gap-2">
              {/* One page: nothing to pick or page through, so plain text and no buttons. */}
              {isSinglePage ? (
                <p className="text-sm whitespace-nowrap text-muted-foreground">
                  {m.common_table_showing()}{' '}
                  <strong className="font-medium text-foreground">{pageRanges[0]?.label}</strong>{' '}
                  {m.common_table_of()} <strong className="font-medium text-foreground">{rowCount}</strong>{' '}
                  {m.common_table_results({ count: rowCount })}
                </p>
              ) : (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <p className="text-sm text-muted-foreground">{m.common_table_showing()}</p>
                  <Select
                    items={pageRanges}
                    value={pageIndex + 1}
                    onValueChange={(value) => {
                      table.setPageIndex((value as number) - 1)
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      className="min-w-none w-fit"
                      aria-label={m.common_table_select_range()}
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
                    {m.common_table_of()} <strong className="font-medium text-foreground">{rowCount}</strong>{' '}
                    {m.common_table_results({ count: rowCount })}
                  </p>
                </div>
              )}

              {!isSinglePage && (
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        className="sm:*:[svg]:hidden"
                        render={
                          <Button
                            size="sm"
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => {
                              table.previousPage()
                            }}
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
                            onClick={() => {
                              table.nextPage()
                            }}
                            variant="outline"
                          />
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardFrameFooter>
        )}
      </CardFrame>
    </div>
  )
}
