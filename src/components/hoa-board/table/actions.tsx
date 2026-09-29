'use client'

import { useMutation } from '@tanstack/react-query'
import { EllipsisIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toastManager } from '@/components/ui/toast'
import { type InviteResult, resendInvite } from '@/server-actions/hoa-board'
import type { BoardMemberQueryData } from '@/tanstack-queries/hoa-board'
import { InviteLinkDialog } from '../dialog/invite-link'
import { RemoveBoardMemberAlertDialog } from '../dialog/remove-board-member'
import { EditBoardMemberDrawer } from '../drawer/edit-board-member'
import type { BoardViewer } from './columns'

interface ActionsProps {
  member: BoardMemberQueryData
  viewer: BoardViewer
}

export function BoardMembersTableActions({ member, viewer }: ActionsProps) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isRemoveOpen, setRemoveOpen] = useState(false)
  const [invite, setInvite] = useState<InviteResult | null>(null)

  const resend = useMutation({
    mutationFn: async () => {
      const result = await resendInvite(member.id)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: setInvite,
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo generar el enlace', description: error.message })
    },
  })

  return (
    <>
      <EditBoardMemberDrawer
        member={member}
        open={isEditOpen}
        onOpenChange={setEditOpen}
        canGrantAdmin={viewer.isAdmin}
      />
      <RemoveBoardMemberAlertDialog member={member} open={isRemoveOpen} onOpenChange={setRemoveOpen} />
      <InviteLinkDialog
        invite={invite}
        onOpenChange={(open) => {
          if (!open) setInvite(null)
        }}
      />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto"
              aria-label={`Acciones de ${member.full_name}`}
              loading={resend.isPending}
            >
              <EllipsisIcon className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-56">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 py-0">{member.full_name}</MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              Editar roles
            </MenuItem>

            <MenuItem
              onClick={() => {
                resend.mutate()
              }}
            >
              Nuevo enlace de acceso
            </MenuItem>

            <MenuItem
              variant="destructive"
              onClick={() => {
                setRemoveOpen(true)
              }}
            >
              Quitar de la mesa
            </MenuItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}
