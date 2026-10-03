import { IconInfoCircle, IconSearch, IconX } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { InviteResult } from '@/server-actions/hoa-board'
import type { BoardMemberQueryData } from '@/tanstack-queries/hoa-board'
import { InviteLinkDialog } from '../dialog/invite-link'
import { AddBoardMemberDrawer } from '../drawer/add-board-member'
import type { BoardViewer } from './columns'

interface BoardMembersDataTableHeaderProps {
  table: Table<DataTableFeatures, BoardMemberQueryData>
  viewer: BoardViewer
}

export function BoardMembersDataTableHeader({ table, viewer }: BoardMembersDataTableHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [isAddOpen, setAddOpen] = useState(false)
  const [invite, setInvite] = useState<InviteResult | null>(null)
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-board', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length

  useEffect(() => {
    table.getColumn('full_name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <AddBoardMemberDrawer
        open={isAddOpen}
        onOpenChange={setAddOpen}
        canGrantAdmin={viewer.isAdmin}
        onInvited={(result) => {
          setInvite(result)
          setInviteDialogOpen(true)
        }}
      />
      <InviteLinkDialog
        invite={invite}
        open={isInviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        // Keep the invite until the close animation ends, so the name doesn't vanish mid-fade.
        onOpenChangeComplete={(open) => {
          if (!open) {
            setInvite(null)
          }
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
            name="search-board"
            disabled={tableRowsLength === 0}
            onChange={(e) => {
              void setSearchQuery(e.target.value)
            }}
          />
          <InputGroupAddon>
            <IconSearch />
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
                <IconX aria-hidden />
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
                    <IconInfoCircle className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Buscar por nombre o correo</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        {viewer.isManager && (
          <Button
            onClick={() => {
              setAddOpen(true)
            }}
          >
            Agregar integrante
          </Button>
        )}
      </div>
    </>
  )
}
