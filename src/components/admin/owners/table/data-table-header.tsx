import { IconFileExport, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { OwnerWithRelations } from '@/db/schemas/zod'
import { CreateOwnerSheet } from '../sheets/create-owner'

interface OwnersDataTableHeaderProps {
  table: Table<OwnerWithRelations>
}

export function OwnersDataTableHeader({ table }: OwnersDataTableHeaderProps) {
  const [openCreateOwnerDialog, setOpenCreateOwnerDialog] = useState(false)
  const selectedRowsLength = table.getFilteredSelectedRowModel().rows.length

  return (
    <>
      <CreateOwnerSheet state={{ isOpen: openCreateOwnerDialog, onOpenChange: setOpenCreateOwnerDialog }} />

      <div className="flex justify-between">
        <InputGroup className="w-full sm:w-sm">
          <InputGroupAddon align="inline-start">
            <IconSearch className="size-4" />
          </InputGroupAddon>

          <InputGroupInput name="search-owner" placeholder="Buscar propietarios" />
        </InputGroup>

        <div className="flex gap-2">
          {selectedRowsLength > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button size="icon" variant="destructive" aria-label="Borrar propietario">
                    <IconTrash className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Eliminar seleccionados</TooltipContent>
            </Tooltip>
          )}

          <Button variant="outline">
            <IconFileExport className="size-4" />
            <span>Exportar</span>
            {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
          </Button>

          <Button onClick={() => setOpenCreateOwnerDialog(true)}>
            <IconPlus className="size-4" />
            Nuevo
          </Button>
        </div>
      </div>
    </>
  )
}
