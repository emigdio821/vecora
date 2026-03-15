import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ProfileWithAllRelations } from '@/db/schema/zod/profiles'
import { ProfileDetailsSheet } from '../sheets/profile-details'

interface ProfileNameCellProps {
  profile: ProfileWithAllRelations
}

export function ProfileNameCell({ profile }: ProfileNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const profileName = profile.user?.name || 'Perfil sin usuario'

  return (
    <>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {profileName}
      </Button>

      <ProfileDetailsSheet profile={profile} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
