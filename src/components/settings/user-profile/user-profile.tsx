import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { userProfileQueryOptions } from '@/api/tanstack-queries/user'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TextGenericSkeleton } from '@/components/shared/skeletons/text-generic'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getAvatarFallback } from '@/lib/utils'
import { UpdateUserProfileSheet } from './sheets/update-user-profile'

export function ProfileSettings() {
  const [isUpdateSheetOpen, setUpdateSheetOpen] = useState(false)
  const { data, isLoading, refetch, error } = useQuery(userProfileQueryOptions())

  if (isLoading) {
    return <TextGenericSkeleton />
  }

  if (error || !data) {
    return (
      <TSQueryGenericError
        refetch={refetch}
        errorDescription="Algo salió mal al cargar la dirección residencial"
      />
    )
  }

  return (
    <>
      <UpdateUserProfileSheet profile={data} open={isUpdateSheetOpen} onOpenChange={setUpdateSheetOpen} />

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <Avatar>
              <AvatarFallback>{getAvatarFallback(data.user.name)}</AvatarFallback>
            </Avatar>

            <div className="flex gap-1">
              <span className="font-medium">Nombre</span>
              <span className="text-muted-foreground">{data.user.name}</span>
            </div>
            <div className="flex gap-1">
              <span className="font-medium">Correo</span>
              <span className="text-muted-foreground">{data.user.email}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setUpdateSheetOpen(true)}>Actualizar</Button>
        </CardFooter>
      </Card>
    </>
  )
}
