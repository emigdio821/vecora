import { IconDots } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
import { setAmenityActive } from '@/server-actions/presidency'
import { type AmenityQueryData, PRESIDENCY_QUERY_KEY, reservationCount } from '@/tanstack-queries/presidency'
import { DeleteAmenityAlertDialog } from '../dialog/delete-amenity'
import { EditAmenityDrawer } from '../drawer/edit-amenity'

interface ActionsProps {
  amenity: AmenityQueryData
}

export function AmenitiesTableActions({ amenity }: ActionsProps) {
  const canManage = useHasRole('president')
  const queryClient = useQueryClient()
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Cancelled bookings count too: they stay as history.
  const canDelete = reservationCount(amenity) === 0

  const toggleActive = useMutation({
    mutationFn: async () => {
      const result = await setAmenityActive(amenity.id, !amenity.is_active)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY, 'amenities'] })
      toastManager.add({
        type: 'success',
        title: amenity.is_active ? m.presidency_amenity_deactivated() : m.presidency_amenity_activated(),
        description: amenity.is_active
          ? m.presidency_amenity_deactivated_description({ name: amenity.name })
          : m.presidency_amenity_activated_description({ name: amenity.name }),
      })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.presidency_update_failed(), description: error.message })
    },
  })

  // Every item here writes, so readers see no menu.
  if (!canManage) return null

  return (
    <>
      <EditAmenityDrawer amenity={amenity} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeleteAmenityAlertDialog amenity={amenity} open={isDeleteOpen} onOpenChange={setDeleteOpen} />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.presidency_actions_for({ name: amenity.name })}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 line-clamp-2 py-0 wrap-break-word">
              {amenity.name}
            </MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              {m.common_action_edit()}
            </MenuItem>

            <MenuItem
              disabled={toggleActive.isPending}
              onClick={() => {
                toggleActive.mutate()
              }}
            >
              {amenity.is_active ? m.presidency_deactivate() : m.presidency_activate()}
            </MenuItem>

            {canDelete && (
              <MenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteOpen(true)
                }}
              >
                {m.common_action_delete()}
              </MenuItem>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}
