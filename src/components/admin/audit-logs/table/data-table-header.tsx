import { IconCirclePlus, IconFileExport, IconInfoCircle, IconSearch } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AuditLogWithUserAndProfile } from '@/db/schemas/zod/audit-logs'
import { STARTING_YEAR } from '@/lib/constants'

interface AuditLogsDataTableHeaderProps {
  table: Table<AuditLogWithUserAndProfile>
}

export interface YearFacetedFilterOption {
  label: string
  value: number
}

const currentYear = new Date().getFullYear()
const facetedFilterYears: YearFacetedFilterOption[] = Array.from(
  { length: currentYear - STARTING_YEAR + 1 },
  (_, i) => ({
    value: STARTING_YEAR + i,
    label: (STARTING_YEAR + i).toString(),
  }),
)

export function AuditLogsDataTableHeader({ table }: AuditLogsDataTableHeaderProps) {
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-audit-logs', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  function renderYearFacetedFilterValue(value: YearFacetedFilterOption[] | null) {
    if (!value || value.length === 0) return 'Año'

    return (
      <>
        <span>Año</span>
        <Separator orientation="vertical" />
        {value.length < 3 ? (
          value
            .sort((a, b) => a.value - b.value)
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
    table.getColumn('user')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row">
      <InputGroup className="w-full sm:w-sm">
        <InputGroupInput
          type="search"
          value={searchQuery}
          aria-label="Buscar"
          placeholder="Buscar"
          name="search-audit-logs"
          onChange={(e) => setSearchQuery(e.target.value || null)}
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
        {tableRowsLength > 0 && (
          <Button variant="outline" disabled>
            <IconFileExport className="size-4" />
            <span>Exportar</span>
            {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
          </Button>
        )}

        <Combobox
          multiple
          items={facetedFilterYears}
          onValueChange={(item) => {
            table.getColumn('timestamp')?.setFilterValue(item)
          }}
        >
          <ComboboxTrigger
            render={<Button variant="outline" name="years-faceted-filter" className="border-dashed" />}
          >
            <IconCirclePlus />
            <ComboboxValue placeholder="Año">{renderYearFacetedFilterValue}</ComboboxValue>
          </ComboboxTrigger>
          <ComboboxPopup align="end" aria-label="Selecciona una opción" className="[--anchor-width:120px]">
            <div className="border-b p-1">
              <ComboboxInput
                showTrigger={false}
                placeholder="Buscar"
                aria-invalid="false"
                startAddon={<IconSearch />}
                className="w-full min-w-full rounded-sm before:rounded-[calc(var(--radius-sm)-1px)]"
              />
            </div>
            <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  <span>{item.label}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </div>
    </div>
  )
}
