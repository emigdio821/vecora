import {
  IconBan,
  IconDotsVertical,
  IconEdit,
  IconInfoCircle,
  IconReload,
  IconTrash,
  IconUserUp,
} from '@tabler/icons-react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { useState } from 'react'
import { banProfile, deleteProfile, unbanProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PROFILES_QUERY_KEY, type ProfileQueryData } from '@/api/tanstack-queries/profiles'
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
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { BanProfileData, DeleteProfileData, UnbanProfileData } from '@/schemas/profiles'
import { EditProfileSheet } from '../sheets/edit-profile'
import { ProfileDetailsSheet } from '../sheets/profile-details'

interface ActionsProps {
  profile: ProfileQueryData
}

export function ProfilesTableActions({ profile }: ActionsProps) {
  const [banReason, setBanReason] = useState('')
  const [isBanDialogOpen, setBanDialogOpen] = useState(false)
  const [isUnbanDialogOpen, setUnbanDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isEditProfileSheetOpen, setEditProfileSheetOpen] = useState(false)
  const [isProfileDetailsSheetOpen, setProfileDetailsSheetOpen] = useState(false)

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

  const banProfileMutation = useEntityMutation({
    mutationFn: async (data: BanProfileData) => {
      return await banProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil desactivado',
    successDescription: 'El perfil ha sido desactivado exitosamente.',
    errorDescription: 'Ocurrió un error al desactivar el perfil, intenta nuevamente.',
    onSuccess: () => {
      setBanDialogOpen(false)
    },
  })

  const unbanProfileMutation = useEntityMutation({
    mutationFn: async (data: UnbanProfileData) => {
      return await unbanProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil reactivado',
    successDescription: 'El perfil ha sido reactivado exitosamente.',
    errorDescription: 'Ocurrió un error al reactivar el perfil, intenta nuevamente.',
    onSuccess: () => {
      setUnbanDialogOpen(false)
    },
  })

  async function handleDeleteProfile() {
    await deleteProfileMutation.mutateAsync({ profileId: profile.id })
  }

  async function handleBanProfile() {
    await banProfileMutation.mutateAsync({ userId: profile.userId, reason: banReason })
  }

  async function handleUnbanProfile() {
    await unbanProfileMutation.mutateAsync({ userId: profile.userId })
  }

  function getLinkedUserNavigation(): LinkProps {
    const resident = profile.resident

    if (resident) {
      const residentName = `${resident.firstName} ${resident.lastName}`
      return {
        to: '/admin/residential' as const,
        search: { tab: 'residents', 'search-residents': residentName },
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
        actionLabel="Reactivar"
        title="¿Reactivar perfil?"
        description="El perfil será reactivado y el usuario podrá acceder a su cuenta nuevamente."
        action={handleUnbanProfile}
        state={{ isOpen: isUnbanDialogOpen, onOpenChange: setUnbanDialogOpen }}
      />

      <AlertDialogGeneric
        variant="warning"
        actionLabel="Desactivar"
        title="¿Desactivar perfil?"
        description="El perfil será desactivado y el usuario no podrá acceder a su cuenta. Esta acción puede ser revertida."
        action={handleBanProfile}
        state={{ isOpen: isBanDialogOpen, onOpenChange: setBanDialogOpen }}
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

      <ProfileDetailsSheet
        profile={profile}
        state={{ isOpen: isProfileDetailsSheetOpen, onOpenChange: setProfileDetailsSheetOpen }}
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
                aria-label="Ir al residente vinculado"
              />
            }
          />
          <TooltipContent>Ir al residente vinculado</TooltipContent>
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

              <DropdownMenuItem onClick={() => setProfileDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditProfileSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              {profile.user?.banned ? (
                <DropdownMenuItem onClick={() => setUnbanDialogOpen(true)}>
                  <IconReload className="size-4" />
                  <span>Reactivar</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
                  <IconBan className="size-4" />
                  <span>Desactivar</span>
                </DropdownMenuItem>
              )}

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
