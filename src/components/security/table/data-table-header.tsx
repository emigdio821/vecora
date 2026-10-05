import { IconFilter } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'
import { STATUS_LABEL } from '@/components/shared/request-status'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { REQUEST_STATUSES, type RequestStatus } from '@/lib/validations/requests'
import { SECURITY_REQUEST_KINDS, type SecurityRequestKind } from '@/lib/validations/security'
import type { SecurityRequestQueryData } from '@/tanstack-queries/security'
import { CreateRequestDrawer } from '../drawer/create-request'
import { KIND_LABEL } from '../kind'
import type { SecurityViewer } from './columns'

const STATUS_FILTERS = ['all', ...REQUEST_STATUSES] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_FILTER_ITEMS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  ...REQUEST_STATUSES.map((status: RequestStatus) => ({ value: status, label: `${STATUS_LABEL[status]}s` })),
]

const KIND_FILTERS = ['all', ...SECURITY_REQUEST_KINDS] as const
export type KindFilter = (typeof KIND_FILTERS)[number]

const KIND_FILTER_ITEMS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...SECURITY_REQUEST_KINDS.map((kind: SecurityRequestKind) => ({ value: kind, label: KIND_LABEL[kind] })),
]

/** URL-backed status filter, shared by the header (control) and the table (data). */
export function useStatusFilter() {
  return useQueryState('status', parseAsStringLiteral(STATUS_FILTERS).withDefault('all'))
}

/** URL-backed kind filter, shared by the header (control) and the table (data). */
export function useKindFilter() {
  return useQueryState('kind', parseAsStringLiteral(KIND_FILTERS).withDefault('all'))
}

interface RequestsDataTableHeaderProps {
  table: Table<DataTableFeatures, SecurityRequestQueryData>
  viewer: SecurityViewer
  isLoading: boolean
}

export function RequestsDataTableHeader({ table, viewer, isLoading }: RequestsDataTableHeaderProps) {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [status, setStatus] = useStatusFilter()
  const [kind, setKind] = useKindFilter()
  const activeFilterLabels = [
    status !== 'all' && STATUS_FILTER_ITEMS.find((item) => item.value === status)?.label,
    kind !== 'all' && KIND_FILTER_ITEMS.find((item) => item.value === kind)?.label,
  ].filter(Boolean)
  const isFiltered = activeFilterLabels.length > 0
  const filtersLabel = isFiltered ? `Filtros: ${activeFilterLabels.join(', ')}` : 'Filtros'

  return (
    <>
      <CreateRequestDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="title"
            param="search-requests"
            hint="Buscar por concepto, detalles, tipo o quién la solicitó"
          />

          <Menu>
            <Tooltip>
              <TooltipTrigger
                closeOnClick={false}
                render={
                  <MenuTrigger
                    render={
                      <Button size="icon" variant="outline" className="relative" aria-label={filtersLabel}>
                        <IconFilter className="size-4" />
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
              <TooltipContent>{filtersLabel}</TooltipContent>
            </Tooltip>

            <MenuPopup align="end">
              <MenuGroup>
                <MenuGroupLabel>Estado</MenuGroupLabel>
                <MenuRadioGroup
                  value={status}
                  onValueChange={(value: StatusFilter) => {
                    void setStatus(value)
                  }}
                >
                  {STATUS_FILTER_ITEMS.map((item) => (
                    <MenuRadioItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>

              <MenuSeparator />

              <MenuGroup>
                <MenuGroupLabel>Tipo</MenuGroupLabel>
                <MenuRadioGroup
                  value={kind}
                  onValueChange={(value: KindFilter) => {
                    void setKind(value)
                  }}
                >
                  {KIND_FILTER_ITEMS.map((item) => (
                    <MenuRadioItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuGroup>
            </MenuPopup>
          </Menu>
        </div>

        {viewer.canRequest && (
          <Button
            className="self-end"
            disabled={isLoading}
            onClick={() => {
              setCreateOpen(true)
            }}
          >
            Nueva solicitud
          </Button>
        )}
      </div>
    </>
  )
}
