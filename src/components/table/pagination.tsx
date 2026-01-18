import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationInitialPage,
  PaginationItem,
  PaginationLastPage,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination'

interface DataTablePaginationProps<T> {
  table: Table<T>
  pageSizeOptions?: readonly number[]
}

export const DEFAULT_TABLE_PAGE_SIZE = 10
// const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const

export function DataTablePagination<T>({ table }: DataTablePaginationProps<T>) {
  // const pagination = table.getState().pagination
  // const { pageIndex, pageSize } = pagination

  // function handlePageSizeChange(value: string | null) {
  //   if (!value) return
  //   table.setPageSize(Number(value))
  // }

  function handleFirstPage() {
    table.setPageIndex(0)
  }

  function handleLastPage() {
    table.setPageIndex(table.getPageCount() - 1)
  }

  return (
    <>
      <div className="flex w-full items-center gap-2">
        <p className="text-muted-foreground text-sm">Mostrando</p>
        <Select
          items={Array.from({ length: table.getPageCount() }, (_, i) => {
            const start = i * table.getState().pagination.pageSize + 1
            const end = Math.min((i + 1) * table.getState().pagination.pageSize, table.getRowCount())
            const pageNum = i + 1
            return { label: `${start}-${end}`, value: pageNum }
          })}
          onValueChange={(value) => {
            table.setPageIndex((value as number) - 1)
          }}
          value={table.getState().pagination.pageIndex + 1}
        >
          <SelectTrigger aria-label="Select result range" className="w-fit min-w-none" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {Array.from({ length: table.getPageCount() }, (_, i) => {
              const start = i * table.getState().pagination.pageSize + 1
              const end = Math.min((i + 1) * table.getState().pagination.pageSize, table.getRowCount())
              const pageNum = i + 1
              return (
                <SelectItem key={pageNum} value={pageNum}>
                  {`${start}-${end}`}
                </SelectItem>
              )
            })}
          </SelectPopup>
        </Select>
        <p className="text-muted-foreground text-sm">
          de <strong className="font-medium text-foreground">{table.getRowCount()}</strong> resultados
        </p>
      </div>

      {/* <div className="flex items-center space-x-2">
        <Label htmlFor="rows-per-page" className="font-normal">
          Elementos por página:
        </Label>
        <Select name="rows-per-page" value={pageSize.toString()} onValueChange={handlePageSizeChange}>
          <SelectTrigger id="rows-per-page" className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-24">
            <SelectGroup>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div> */}

      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem className="hidden sm:block">
            <PaginationInitialPage
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!table.getCanPreviousPage()}
                  onClick={handleFirstPage}
                />
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                />
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                />
              }
            />
          </PaginationItem>
          <PaginationItem className="hidden sm:block">
            <PaginationLastPage
              render={
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!table.getCanNextPage()}
                  onClick={handleLastPage}
                />
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  )
}
