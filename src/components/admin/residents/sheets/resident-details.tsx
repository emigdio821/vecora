import { IconCurrencyDollar, IconFlag, IconHome, IconUser, IconWind } from '@tabler/icons-react'
import type { ResidentQueryData } from '@/api/tanstack-queries/residents'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
import { PaymentStatusBadge } from '@/components/shared/payments/status-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { ViolationStatusBadge } from '@/components/shared/violations/status-badge'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/utils'

interface ResidentDetailsSheetProps {
  resident: ResidentQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function ResidentDetailsSheet({ resident, state }: ResidentDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const fullName = `${resident.firstName} ${resident.lastName}`
  const userRole = resident.profile?.user?.role

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del residente</SheetTitle>
          <SheetDescription>Información completa y detallada del residente</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Resident info */}
          <CollapsibleDetails
            title="Información personal"
            icon={IconUser}
            content={
              <>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Nombre</h2>
                    <p className="text-muted-foreground text-sm">{fullName}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={resident.id} />
                </div>

                <div>
                  <h2 className="font-medium text-sm">Correo electrónico</h2>
                  <p className="text-muted-foreground text-sm">{resident.email}</p>
                </div>

                <div>
                  <h2 className="font-medium text-sm">Teléfono</h2>
                  <p className="text-muted-foreground text-sm">{resident.phone}</p>
                </div>

                <div>
                  <h2 className="font-medium text-sm">Tipo</h2>
                  <Badge className="mt-1" variant="outline">
                    {resident.isOwner ? 'Propietario' : 'Residente'}
                  </Badge>
                </div>

                <div>
                  <h2 className="font-medium text-sm">Rol</h2>
                  <div className="mt-1">
                    {userRole ? (
                      <RoleNameBadge roleName={userRole} />
                    ) : (
                      <Badge variant="warning">Sin rol</Badge>
                    )}
                  </div>
                </div>

                {resident.notes && (
                  <div>
                    <h2 className="font-medium text-sm">Notas</h2>
                    <p className="text-muted-foreground text-sm">{resident.notes}</p>
                  </div>
                )}
              </>
            }
          />

          {/* Houses info (only for owners) */}
          {resident.isOwner && (
            <CollapsibleDetails
              title="Casas"
              icon={IconHome}
              content={
                resident.houses.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {resident.houses.map((house) => (
                      <HouseNumberBadge key={house.id} number={house.houseNumber} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <Empty className="p-1">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-0">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>No tiene casas asignadas</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                )
              }
            />
          )}

          {/* Violations info */}
          <CollapsibleDetails
            title={
              <div className="flex items-center gap-1">
                Infracciones
                {resident.violations.length > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {resident.violations.length}
                  </Badge>
                )}
              </div>
            }
            icon={IconFlag}
            content={
              resident.violations.length > 0 ? (
                <div>
                  {resident.violations.map((violation) => (
                    <div key={violation.id}>
                      <ViolationStatusBadge status={violation.status} />
                      <h2 className="font-medium text-sm">${violation.amount}</h2>
                      <p className="text-muted-foreground text-sm">{violation.concept}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Sin infracciones</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )
            }
          />

          {/* Payments info */}
          <CollapsibleDetails
            title={
              <div className="flex items-center gap-1">
                Pagos
                {resident.payments.length > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {resident.payments.length}
                  </Badge>
                )}
              </div>
            }
            icon={IconCurrencyDollar}
            content={
              resident.payments.length > 0 ? (
                <div>
                  {resident.payments.map((payment) => (
                    <div key={payment.id}>
                      <PaymentStatusBadge status={payment.status} />
                      <h2 className="font-medium text-sm">${payment.amount}</h2>
                      <p className="text-muted-foreground text-sm">{payment.concept}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Sin pagos pendientes</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )
            }
          />
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de registro</span>
            <span>{formatDate(resident.createdAt)}</span>
          </div>
          {resident.updatedAt &&
            new Date(resident.updatedAt).getTime() > new Date(resident.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(resident.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
