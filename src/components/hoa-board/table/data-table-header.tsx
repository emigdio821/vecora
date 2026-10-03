import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
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
  const [isAddOpen, setAddOpen] = useState(false)
  const [invite, setInvite] = useState<InviteResult | null>(null)
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false)

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
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="full_name"
            param="search-board"
            hint="Buscar por nombre o correo"
          />
        </div>

        {viewer.isManager && (
          <Button
            className="self-end"
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
