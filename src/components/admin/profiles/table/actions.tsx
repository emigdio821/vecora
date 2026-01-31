import {
  IconDotsVertical,
  IconEdit,
  IconInfoCircle,
  IconTrash,
  IconUserOff,
  IconUserUp,
} from '@tabler/icons-react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { useState } from 'react'
import { banProfile, deleteProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PROFILES_QUERY_KEY } from '@/api/tanstack-queries/profiles'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { BanProfileData, DeleteProfileData } from '@/schemas/profiles'
import { EditProfileSheet } from '../sheets/edit-profile'

interface ActionsProps {
  profile: ProfileWithAllRelations
}

export function ProfilesTableActions({ profile }: ActionsProps) {
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isEditProfileSheetOpen, setEditProfileSheetOpen] = useState(false)

  const deleteProfileMutation = useEntityMutation({
    mutationFn: async (data: DeleteProfileData) => {
      return await deleteProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil eliminado',
    successDescription: 'El perfil ha sido eliminado exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar el perfil, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  const deactivateProfileMutation = useEntityMutation({
    mutationFn: async (data: BanProfileData) => {
      return await banProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil desactivado',
    successDescription: 'El perfil ha sido desactivado exitosamente.',
    errorDescription: 'Ocurrió un error al desactivar el perfil, intenta nuevamente.',
    onSuccess: () => {
      setDeactivateDialogOpen(false)
    },
  })

  async function handleDeleteProfile() {
    await deleteProfileMutation.mutateAsync({ profileId: profile.id })
  }

  async function handleDeactivateProfile() {
    // TODO: Implement reason and duration
    await deactivateProfileMutation.mutateAsync({ userId: profile.userId })
  }

  function getLinkedUserNavigation(): LinkProps {
    const owner = profile.owner
    const externalUser = profile.externalUser

    if (profile.profileType === 'owner' && owner) {
      const ownerFullName = `${owner.firstName} ${owner.lastName}`
      return {
        to: '/admin/residential' as const,
        search: { tab: 'owners', 'search-owners': ownerFullName },
      }
    }

    if (profile.profileType === 'external' && externalUser) {
      const externalUserFullName = `${externalUser.firstName} ${externalUser.lastName}`
      return {
        to: '/admin/users' as const,
        search: { tab: 'external-users', 'search-external-users': externalUserFullName },
      }
    }

    return {
      to: '/admin/residential' as const,
      search: {},
    }
  }

  return (
    <>
      <AlertDialogGeneric
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar perfil?"
        description="Se eliminará de manera permanentemente. Esta acción no se puede deshacer."
        action={handleDeleteProfile}
        state={{ isOpen: isDeleteDialogOpen, onOpenChange: setDeleteDialogOpen }}
      />

      <AlertDialogGeneric
        variant="warning"
        actionLabel="Desactivar"
        title="¿Desactivar perfil?"
        description="El perfil será desactivado y el usuario no podrá acceder a su cuenta. Esta acción puede ser revertida."
        action={handleDeactivateProfile}
        state={{ isOpen: isDeactivateDialogOpen, onOpenChange: setDeactivateDialogOpen }}
      />

      <EditProfileSheet
        profile={profile}
        state={{ isOpen: isEditProfileSheetOpen, onOpenChange: setEditProfileSheetOpen }}
      />

      <div className="flex items-center justify-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                nativeButton={false}
                variant="ghost"
                render={
                  <Link {...getLinkedUserNavigation()}>
                    <IconUserUp className="size-4" />
                  </Link>
                }
                size="icon"
                aria-label="Ir al usuario vinculado"
              />
            }
          />
          <TooltipContent>Ir al usuario vinculado</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button aria-label="Table actions" size="icon" variant="ghost">
                <IconDotsVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="max-w-42">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
                {`${profile.user?.name}`}
              </DropdownMenuLabel>

              <DropdownMenuItem>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditProfileSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setDeactivateDialogOpen(true)}>
                <IconUserOff className="size-4" />
                Desactivar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <IconTrash className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
