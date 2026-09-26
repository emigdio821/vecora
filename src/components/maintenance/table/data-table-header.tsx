import type { Table } from '@tanstack/react-table'
import { ListFilterIcon, SearchIcon, XIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/components/ui/menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { REQUEST_STATUSES, type RequestStatus } from '@/lib/validations/maintenance'
import type { MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { CreateRequestDrawer } from '../drawer/create-request'
import { STATUS_LABEL } from '../status'
import type { MaintenanceViewer } from './columns'

const STATUS_FILTERS = ['all', ...REQUEST_STATUSES] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_FILTER_ITEMS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  ...REQUEST_STATUSES.map((status: RequestStatus) => ({ value: status, label: `${STATUS_LABEL[status]}s` })),
]

/** URL-backed status filter, shared by the header (control) and the table (data). */
export function useStatusFilter() {
  return useQueryState('status', parseAsStringLiteral(STATUS_FILTERS).withDefault('all'))
}

interface RequestsDataTableHeaderProps {
  table: Table<DataTableFeatures, MaintenanceRequestQueryData>
  viewer: MaintenanceViewer
}

export function RequestsDataTableHeader({ table, viewer }: RequestsDataTableHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-requests', parseAsString.withDefault(''))
  const [status, setStatus] = useStatusFilter()
  const isFiltered = status !== 'all'
  const activeStatusLabel = STATUS_FILTER_ITEMS.find((item) => item.value === status)?.label
  const tableRowsLength = table.getCoreRowModel().rows.length

  useEffect(() => {
    table.getColumn('title')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateRequestDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-2xs md:w-xs xl:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar por concepto o persona"
            ref={searchInputRef}
            name="search-requests"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>

          {searchQuery && (
            <InputGroupAddon align="inline-end">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  searchInputRef.current?.focus()
                  void setSearchQuery('')
                }}
              >
                <XIcon aria-hidden />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="flex flex-wrap justify-end gap-2">
          <Menu>
            <Tooltip>
              <TooltipTrigger
                closeOnClick={false}
                render={
                  <MenuTrigger
                    render={
                      <Button
                        size="icon"
                        variant="outline"
                        className="relative"
                        aria-label={isFiltered ? `Filtros: ${activeStatusLabel}` : 'Filtros'}
                      >
                        <ListFilterIcon className="size-4" />
                        {/* The list is narrowed; don't let that go unnoticed. */}
                        {isFiltered && (
                          <span
                            aria-hidden
                            className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-background bg-primary"
                          />
                        )}
                      </Button>
                    }
                  />
                }
              />
              <TooltipContent>{isFiltered ? `Filtros: ${activeStatusLabel}` : 'Filtros'}</TooltipContent>
            </Tooltip>

            <MenuPopup align="end">
              <MenuGroup>
                <MenuGroupLabel>Estado</MenuGroupLabel>
                <MenuRadioGroup value={status} onValueChange={(value: StatusFilter) => void setStatus(value)}>
                  {STATUS_FILTER_ITEMS.map((item) => (
                    <MenuRadioItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
            </MenuPopup>
          </Menu>

          {viewer.canRequest && <Button onClick={() => setCreateOpen(true)}>Nueva solicitud</Button>}
        </div>
      </div>
    </>
  )
}
