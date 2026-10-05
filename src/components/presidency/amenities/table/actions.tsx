import { IconDots } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { toastManager } from '@/components/ui/toast'
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
        title: amenity.is_active ? 'Área desactivada' : 'Área activada',
        description: amenity.is_active
          ? `${amenity.name} ya no aparecerá al reservar`
          : `${amenity.name} vuelve a estar disponible al reservar`,
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
      <EditAmenityDrawer amenity={amenity} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeleteAmenityAlertDialog amenity={amenity} open={isDeleteOpen} onOpenChange={setDeleteOpen} />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={`Acciones de ${amenity.name}`}
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
              Editar
            </MenuItem>

            <MenuItem
              disabled={toggleActive.isPending}
              onClick={() => {
                toggleActive.mutate()
              }}
            >
              {amenity.is_active ? 'Desactivar' : 'Activar'}
            </MenuItem>

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
