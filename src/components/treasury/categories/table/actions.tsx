import { IconDots } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
import { setCategoryActive } from '@/server-actions/treasury'
import { type CategoryQueryData, transactionCount, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { DeleteCategoryAlertDialog } from '../dialog/delete-category'
import { EditCategoryDrawer } from '../drawer/edit-category'

interface ActionsProps {
  category: CategoryQueryData
}

export function CategoriesTableActions({ category }: ActionsProps) {
  const canManage = useHasRole('treasurer')
  const queryClient = useQueryClient()
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // System categories (fee, late fee, common areas) can only be renamed.
  const isSystem = category.key !== null
  // Soft-deleted movements count too: the ledger is never purged.
  const canDelete = !isSystem && transactionCount(category) === 0

  const toggleActive = useMutation({
    mutationFn: async () => {
      const result = await setCategoryActive(category.id, !category.is_active)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY, 'categories'] })
      toastManager.add({
        type: 'success',
        title: category.is_active ? m.treasury_category_deactivated() : m.treasury_category_activated(),
        description: category.is_active
          ? m.treasury_category_deactivated_description({ name: category.name })
          : m.treasury_category_activated_description({ name: category.name }),
      })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.treasury_update_failed(), description: error.message })
    },
  })

  // Every item here writes, so readers see no menu.
  if (!canManage) return null

  return (
    <>
      <EditCategoryDrawer category={category} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeleteCategoryAlertDialog category={category} open={isDeleteOpen} onOpenChange={setDeleteOpen} />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.treasury_actions_for({ name: category.name })}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 line-clamp-2 py-0 wrap-break-word">
              {category.name}
            </MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              {m.common_action_edit()}
            </MenuItem>

            {!isSystem && (
              <MenuItem
                disabled={toggleActive.isPending}
                onClick={() => {
                  toggleActive.mutate()
                }}
              >
                {category.is_active ? m.treasury_category_deactivate() : m.treasury_category_activate()}
              </MenuItem>
            )}

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
