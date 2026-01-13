import {
  IconChevronLeft,
  IconChevronLeftPipe,
  IconChevronRight,
  IconChevronRightPipe,
} from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps<T> {
  table: Table<T>
  showSelection?: boolean
  pageSizeOptions?: readonly number[]
}

export const DEFAULT_TABLE_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const

export function DataTablePagination<T>({
  table,
  showSelection = true,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps<T>) {
  const rowLength = table.getFilteredRowModel().rows.length
  const pagination = table.getState().pagination
  const { pageIndex, pageSize } = pagination

  if (rowLength <= DEFAULT_TABLE_PAGE_SIZE) return null

  function handlePageSizeChange(value: string | null) {
    if (!value) return
    table.setPageSize(Number(value))
  }

  function handleFirstPage() {
    table.setPageIndex(0)
  }

  function handleLastPage() {
    table.setPageIndex(table.getPageCount() - 1)
  }

  return (
    <div className="flex flex-col items-center justify-end gap-2 sm:flex-row">
      {showSelection && (
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} de {rowLength} seleccionados
        </div>
      )}
      <div className="flex items-center space-x-1 lg:space-x-6">
        <div className="flex items-center space-x-2">
          <Label htmlFor="rows-per-page" className="font-normal">
            Elementos por página:
          </Label>
          <Select name="rows-per-page" value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger id="rows-per-page" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-25 items-center justify-center text-sm">
          Página {pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="outline"
            className="hidden lg:flex"
            onClick={handleFirstPage}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a primera página</span>
            <IconChevronLeftPipe className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={table.previousPage}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a página anterior</span>
            <IconChevronLeft className="size-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={table.nextPage} disabled={!table.getCanNextPage()}>
            <span className="sr-only">Ir a página siguiente</span>
            <IconChevronRight className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="hidden lg:flex"
            onClick={handleLastPage}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a última página</span>
            <IconChevronRightPipe className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
