import { IconInfoCircle, IconPlus, IconSearch, IconTrash, IconUserOff } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'

interface ProfilesDataTableHeaderProps {
  table: Table<ProfileWithAllRelations>
}

export function ProfilesDataTableHeader({ table }: ProfilesDataTableHeaderProps) {
  const [openCreateProfileDialog, setOpenCreateProfileDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-profiles', { defaultValue: '' })
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  useEffect(() => {
    table.getColumn('user-name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <AlertDialogGeneric
        variant="warning"
        state={{
          isOpen: isDeactivateDialogOpen,
          onOpenChange: setDeactivateDialogOpen,
        }}
        title="¿Desactivar perfiles?"
        description={
          <div>
            <p>
              Perfiles seleccionados: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción puede ser revertida.</p>
          </div>
        }
      />

      <AlertDialogGeneric
        variant="destructive"
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        title="¿Eliminar perfiles?"
        description={
          <div>
            <p>
              Perfiles seleccionados: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-profiles"
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
              <TooltipContent>Buscar por nombre</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          {selectedRowsLength > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon"
                      variant="warning"
                      aria-label="Desactivar perfiles seleccionados"
                      onClick={() => setDeactivateDialogOpen(true)}
                    >
                      <IconUserOff className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent>Desactivar seleccionados</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon"
                      variant="destructive"
                      aria-label="Borrar perfiles seleccionados"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent>Eliminar seleccionados</TooltipContent>
              </Tooltip>
            </>
          )}

          <Button onClick={() => setOpenCreateProfileDialog(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>
    </>
  )
}
