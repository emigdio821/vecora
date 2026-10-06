import { IconFilter } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
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
import { m } from '@/paraglide/messages'
import type { AmenityQueryData, ReservationQueryData } from '@/tanstack-queries/presidency'
import { CreateReservationDrawer } from '../drawer/create-reservation'

/** URL-backed area filter (an amenity id, or "all"), shared by the header (control) and the table (data). */
export function useAmenityFilter() {
  return useQueryState('area', parseAsString.withDefault('all'))
}

interface ReservationsDataTableHeaderProps {
  table: Table<DataTableFeatures, ReservationQueryData>
  amenities: AmenityQueryData[]
  isLoading: boolean
}

export function ReservationsDataTableHeader({
  table,
  amenities,
  isLoading,
}: ReservationsDataTableHeaderProps) {
  const canManage = useHasRole('president', 'treasurer')
  const [amenityId, setAmenityId] = useAmenityFilter()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const activeAmenity = amenities.find((a) => a.id === amenityId)
  const filterLabel = activeAmenity
    ? m.presidency_filters_with_amenity({ name: activeAmenity.name })
    : m.common_filters()
  const hasActiveAmenity = amenities.some((a) => a.is_active)

  return (
    <>
      <CreateReservationDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="reserved_on"
            param="search-reservations"
            hint={m.presidency_reservation_search_hint()}
          />

          {/* With a single area there's nothing to narrow down. */}
          {amenities.length > 1 && (
            <Menu>
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <MenuTrigger
                      render={
                        <Button size="icon" variant="outline" className="relative" aria-label={filterLabel}>
                          <IconFilter className="size-4" />
                          {/* The list is narrowed; don't let that go unnoticed. */}
                          {activeAmenity && (
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
                <TooltipContent>{filterLabel}</TooltipContent>
              </Tooltip>

              <MenuPopup align="end">
                <MenuGroup>
                  <MenuGroupLabel>{m.presidency_amenity()}</MenuGroupLabel>
                  <MenuRadioGroup
                    value={activeAmenity ? amenityId : 'all'}
                    onValueChange={(value: string) => {
                      void setAmenityId(value)
                    }}
                  >
                    <MenuRadioItem value="all">{m.common_all_feminine()}</MenuRadioItem>
                    {amenities.map((amenity) => (
                      <MenuRadioItem key={amenity.id} value={amenity.id}>
                        {amenity.name}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuGroup>
              </MenuPopup>
            </Menu>
          )}
        </div>

        {canManage && (
          <Button
            className="self-end"
            disabled={isLoading || !hasActiveAmenity}
            onClick={() => {
              setCreateOpen(true)
            }}
          >
            {m.presidency_new_reservation()}
          </Button>
        )}
      </div>
    </>
  )
}
