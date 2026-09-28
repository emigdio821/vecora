import type { Table } from '@tanstack/react-table'
import { InfoIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type ResidentQueryData } from '@/tanstack-queries/residents'
import { DeleteResidentsAlertDialog } from '../dialog/delete-residents'
import { CreateResidentDrawer } from '../drawer/create-resident'

interface ResidentsDataTableHeaderProps {
  table: Table<DataTableFeatures, ResidentQueryData>
}

export function ResidentsDataTableHeader({ table }: ResidentsDataTableHeaderProps) {
  const canManage = useHasRole('president')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [isCreateResidentDrawerOpen, setCreateResidentDrawerOpen] = useState(false)
  const [isDeleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-residents', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedResidents = selectedRows.map((row) => row.original)

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateResidentDrawer open={isCreateResidentDrawerOpen} onOpenChange={setCreateResidentDrawerOpen} />
      <DeleteResidentsAlertDialog
        residents={selectedResidents}
        open={isDeleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        onDeleted={() => {
          table.resetRowSelection()
        }}
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-2xs md:w-xs xl:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            ref={searchInputRef}
            name="search-residents"
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
              <TooltipContent>Buscar por nombre, correo o teléfono</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        {canManage && (
          <div className="flex gap-2">
            {selectedRowsLength > 0 && (
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <Button
                      variant="destructive-outline"
                      aria-label={`Eliminar ${selectedRowsLength} residentes seleccionados`}
                      onClick={() => {
                        setDeleteSelectedOpen(true)
                      }}
                    >
                      <Trash2Icon className="size-4" />
                      <Badge variant="error" size="sm" aria-hidden>
                        {selectedRowsLength}
                      </Badge>
                    </Button>
                  }
                />
                <TooltipContent>Eliminar residentes seleccionados</TooltipContent>
              </Tooltip>
            )}

            {/* {tableRowsLength > 0 && (
            <Button variant="outline" disabled>
              <span>Exportar</span>
              {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
            </Button>
          )} */}

            <Button
              onClick={() => {
                setCreateResidentDrawerOpen(true)
              }}
            >
              Nuevo residente
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
