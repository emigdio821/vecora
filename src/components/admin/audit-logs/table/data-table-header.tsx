import { IconFileExport, IconInfoCircle, IconSearch } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import type { AuditLogQueryData } from '@/api/tanstack-queries/audit-logs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDebouncedSearchQuery } from '@/hooks/use-debounced-search-query-state'
import { STARTING_YEAR } from '@/lib/constants'

interface AuditLogsDataTableHeaderProps {
  table: Table<AuditLogQueryData>
}

export interface YearFacetedFilterOption {
  label: string
  value: string
}

const currentYear = new Date().getFullYear()
const facetedFilterYears: YearFacetedFilterOption[] = Array.from(
  { length: currentYear - STARTING_YEAR + 1 },
  (_, i) => ({
    value: (STARTING_YEAR + i).toString(),
    label: (STARTING_YEAR + i).toString(),
  }),
)

export function AuditLogsDataTableHeader({ table }: AuditLogsDataTableHeaderProps) {
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery, debouncedSearch] = useDebouncedSearchQuery('search-audit-logs')
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  function renderYearFacetedFilterValue(value: YearFacetedFilterOption[] | null) {
    if (!value || value.length === 0) return <span className="font-medium text-foreground">Año</span>

    return (
      <>
        <span className="font-medium">Año</span>
        <Separator orientation="vertical" />
        {value.length < 3 ? (
          value
            .sort((a, b) => a.value.localeCompare(b.value))
            .map((option) => (
              <Badge variant="outline" key={option.value}>
                {option.label}
              </Badge>
            ))
        ) : (
          <Badge variant="outline">{value.length} seleccionados</Badge>
        )}
      </>
    )
  }

  useEffect(() => {
    table.getColumn('user')?.setFilterValue(debouncedSearch)
  }, [debouncedSearch, table])

  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row">
      <InputGroup className="w-full bg-background sm:w-sm">
        <InputGroupInput
          type="search"
          value={searchQuery}
          aria-label="Buscar"
          placeholder="Buscar"
          name="search-audit-logs"
          disabled={tableRowsLength === 0}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon>
          <IconSearch />
        </InputGroupAddon>

        <InputGroupAddon align="inline-end">
          <Tooltip open={isSearchTooltipOpen} onOpenChange={setSearchTooltipOpen}>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Buscar por usuario"
                  className="cursor-default"
                  onClick={(e) => {
                    e.preventBaseUIHandler()
                    setSearchTooltipOpen(true)
                  }}
                >
                  <IconInfoCircle className="size-4" />
                </Button>
              }
            />
            <TooltipContent>Buscar por usuario</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex gap-2">
        <Button variant="outline" disabled>
          <IconFileExport className="size-4" />
          <span>Exportar</span>
          {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
        </Button>

        <Select
          multiple
          disabled={tableRowsLength === 0}
          onValueChange={(items) => {
            table.getColumn('timestamp')?.setFilterValue(items)
          }}
        >
          <SelectTrigger name="audits-per-year-selector">
            <SelectValue>{renderYearFacetedFilterValue}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end" className="max-w-20">
            <SelectGroup>
              <SelectLabel>Año</SelectLabel>
              {facetedFilterYears.map((option) => (
                <SelectItem key={option.value} value={option}>
                  <span>{option.label}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
