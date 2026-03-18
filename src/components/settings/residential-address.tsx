import { IconWind } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { residentialAddressQueryOptions } from '@/api/tanstack-queries/residential-address'
import { useIsAdmin, useIsSuperAdmin } from '@/hooks/use-rbac'
import { TSQueryGenericError } from '../shared/errors/query-generic'
import { TextGenericSkeleton } from '../shared/skeletons/text-generic'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty'
import { UpdateResidentialAddressSheet } from './sheets/update-residential-address'

export function ResidentialAddressSettings() {
  const isAdmin = useIsAdmin()
  const isSuperAdmin = useIsSuperAdmin()
  const canEdit = isAdmin || isSuperAdmin

  const [isUpdateSheetOpen, setUpdateSheetOpen] = useState(false)
  const { data, isLoading, refetch, error } = useQuery(residentialAddressQueryOptions())

  if (isLoading) {
    return <TextGenericSkeleton />
  }

  if (error) {
    return (
      <TSQueryGenericError
        refetch={refetch}
        errorDescription="Algo salió mal al cargar la dirección residencial"
      />
    )
  }

  return (
    <>
      {canEdit && (
        <UpdateResidentialAddressSheet
          address={data}
          open={isUpdateSheetOpen}
          onOpenChange={setUpdateSheetOpen}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dirección residencial</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                <span className="font-medium">País</span>
                <span className="text-muted-foreground">{data.country}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-medium">Nombre</span>
                <span className="text-muted-foreground">{data.name}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-medium">Ciudad</span>
                <span className="text-muted-foreground">{data.city}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-medium">Estado</span>
                <span className="text-muted-foreground">{data.state}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-medium">Calle</span>
                <span className="text-muted-foreground">{data.street}</span>
              </div>
              <div className="flex gap-1">
                <span className="font-medium">Código postal</span>
                <span className="text-muted-foreground">{data.zipCode}</span>
              </div>
            </div>
          ) : (
            <Empty className="flex-0 border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconWind />
                </EmptyMedia>
                <EmptyTitle>Sin dirección</EmptyTitle>
                <EmptyDescription>El residencial no tiene dirección registrada</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
        {canEdit && (
          <CardFooter>
            <Button onClick={() => setUpdateSheetOpen(true)}>Actualizar</Button>
          </CardFooter>
        )}
      </Card>
    </>
  )
}
