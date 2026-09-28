import type { Table } from '@tanstack/react-table'
import { InfoIcon, SearchIcon, XIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { HallReservationQueryData } from '@/tanstack-queries/presidency'
import { CreateHallReservationDrawer } from '../drawer/create-hall-reservation'

interface HallReservationsDataTableHeaderProps {
  table: Table<DataTableFeatures, HallReservationQueryData>
}

export function HallReservationsDataTableHeader({ table }: HallReservationsDataTableHeaderProps) {
  const canManage = useHasRole('president', 'treasurer')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-hall', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length

  useEffect(() => {
    table.getColumn('reserved_on')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateHallReservationDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-2xs md:w-xs xl:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            ref={searchInputRef}
            name="search-hall"
            disabled={tableRowsLength === 0}
            onChange={(e) => {
              void setSearchQuery(e.target.value)
            }}
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

          <InputGroupAddon align="inline-end">
            <Tooltip open={isSearchTooltipOpen} onOpenChange={setSearchTooltipOpen}>
              <TooltipTrigger
                closeOnClick={false}
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="cursor-default"
                    onClick={() => {
                      setSearchTooltipOpen(true)
                    }}
                  >
                    <InfoIcon className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Buscar por número de casa o notas</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        {canManage && (
          <Button
            onClick={() => {
              setCreateOpen(true)
            }}
          >
            Reservar terraza
          </Button>
        )}
      </div>
    </>
  )
}
