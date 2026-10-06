import { IconFilter } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'
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
  MenuTrigger,
} from '@/components/ui/menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { REQUEST_STATUSES } from '@/lib/validations/requests'
import { m } from '@/paraglide/messages'
import type { MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { CreateRequestDrawer } from '../drawer/create-request'
import type { MaintenanceViewer } from './columns'

const STATUS_FILTERS = ['all', ...REQUEST_STATUSES] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_FILTER_ITEMS: { value: StatusFilter; label: string }[] = [
  {
    value: 'all',
    get label() {
      return m.common_all_feminine()
    },
  },
  {
    value: 'pending',
    get label() {
      return m.requests_status_filter_pending()
    },
  },
  {
    value: 'paid',
    get label() {
      return m.requests_status_filter_paid()
    },
  },
  {
    value: 'rejected',
    get label() {
      return m.requests_status_filter_rejected()
    },
  },
]

/** URL-backed status filter, shared by the header (control) and the table (data). */
export function useStatusFilter() {
  return useQueryState('status', parseAsStringLiteral(STATUS_FILTERS).withDefault('all'))
}

interface RequestsDataTableHeaderProps {
  table: Table<DataTableFeatures, MaintenanceRequestQueryData>
  viewer: MaintenanceViewer
  isLoading: boolean
}

export function RequestsDataTableHeader({ table, viewer, isLoading }: RequestsDataTableHeaderProps) {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [status, setStatus] = useStatusFilter()
  const isFiltered = status !== 'all'
  const activeStatusLabel = STATUS_FILTER_ITEMS.find((item) => item.value === status)?.label
  const filtersLabel = isFiltered
    ? m.requests_filters_active({ filters: activeStatusLabel ?? '' })
    : m.common_filters()

  return (
    <>
      <CreateRequestDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="title"
            param="search-requests"
            hint={m.requests_maintenance_search_hint()}
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
                <MenuGroupLabel>{m.common_field_status()}</MenuGroupLabel>
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
            {m.requests_new()}
          </Button>
        )}
      </div>
    </>
  )
}
