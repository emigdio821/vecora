import { IconDots } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toastManager } from '@/components/ui/toast'
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
  // System categories (fee, late fee, terraza) can only be renamed.
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
        title: category.is_active ? 'Categoría desactivada' : 'Categoría activada',
        description: category.is_active
          ? `${category.name} ya no aparecerá al registrar movimientos`
          : `${category.name} vuelve a estar disponible al registrar movimientos`,
      })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo actualizar', description: error.message })
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
              aria-label={`Acciones de ${category.name}`}
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
              Editar
            </MenuItem>

            {!isSystem && (
              <MenuItem
                disabled={toggleActive.isPending}
                onClick={() => {
                  toggleActive.mutate()
                }}
              >
                {category.is_active ? 'Desactivar' : 'Activar'}
              </MenuItem>
            )}

            {canDelete && (
              <MenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteOpen(true)
                }}
              >
                Eliminar
              </MenuItem>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}
