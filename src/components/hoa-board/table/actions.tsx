import { IconDots } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
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
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false)

  const resend = useMutation({
    mutationFn: async () => {
      const result = await resendInvite(member.id)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (result) => {
      setInvite(result)
      setInviteDialogOpen(true)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.board_link_failed(), description: error.message })
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
        open={isInviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        // Keep the invite until the close animation ends, so the name doesn't vanish mid-fade.
        onOpenChangeComplete={(open) => {
          if (!open) {
            setInvite(null)
          }
        }}
      />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.board_member_actions({ name: member.full_name })}
              loading={resend.isPending}
            >
              <IconDots className="size-4" />
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
              {m.board_edit_roles()}
            </MenuItem>

            <MenuItem
              onClick={() => {
                resend.mutate()
              }}
            >
              {m.board_new_access_link()}
            </MenuItem>

            <MenuItem
              variant="destructive"
              onClick={() => {
                setRemoveOpen(true)
              }}
            >
              {m.board_remove_from_board()}
            </MenuItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}
