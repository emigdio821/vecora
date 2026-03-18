import { IconBan, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { banProfile, deleteProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PROFILES_QUERY_KEY, type ProfileQueryData } from '@/api/tanstack-queries/profiles'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { CreateProfileSheet } from '../sheets/create-profile'

interface ProfilesDataTableHeaderProps {
  table: Table<ProfileQueryData>
}

export function ProfilesDataTableHeader({ table }: ProfilesDataTableHeaderProps) {
  const [banReason, setBanReason] = useState('')
  const [openCreateProfileDialog, setOpenCreateProfileDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isBanDialogOpen, setBanDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-profiles', { defaultValue: '' })
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const tableRowsLength = table.getCoreRowModel().rows.length

  const bulkProfileDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Perfiles eliminados',
    successDescription: 'Los perfiles seleccionados han sido eliminados exitosamente',
    deleteFn: async (profile) => {
      await deleteProfile({ data: { profileId: profile.id } })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  const bulkProfileBanMutation = useBulkDelete({
    table,
    successTitle: 'Perfiles desactivados',
    successDescription: 'Los perfiles seleccionados han sido desactivados exitosamente',
    deleteFn: async (profile) => {
      await banProfile({ data: { userId: profile.userId } })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setBanDialogOpen(false)
    },
  })

  async function bulkProfileBan() {
    await bulkProfileBanMutation.mutateAsync()
  }

  async function bulkProfileDelete() {
    await bulkProfileDeleteMutation.mutateAsync()
  }

  useEffect(() => {
    table.getColumn('user-name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateProfileSheet
        state={{ isOpen: openCreateProfileDialog, onOpenChange: setOpenCreateProfileDialog }}
      />
      <AlertDialogGeneric
        variant="warning"
        state={{
          isOpen: isBanDialogOpen,
          onOpenChange: setBanDialogOpen,
        }}
        action={bulkProfileBan}
        title="¿Desactivar perfiles?"
        description={
          <div>
            <p>
              Perfiles seleccionados: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción puede ser revertida.</p>
          </div>
        }
        content={
          <div>
            <Textarea
              name="ban-reason"
              value={banReason}
              className="resize-none"
              aria-label="Razón de la desactivación"
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Razón de la desactivación (opcional)"
            />
          </div>
        }
      />

      <AlertDialogGeneric
        variant="destructive"
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={bulkProfileDelete}
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
            disabled={tableRowsLength === 0}
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
                      onClick={() => setBanDialogOpen(true)}
                    >
                      <IconBan className="size-4" />
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
