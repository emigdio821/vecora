import { IconCurrencyDollar, IconFlag, IconHome, IconUser, IconWind } from '@tabler/icons-react'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
import { PaymentStatusBadge } from '@/components/shared/payments/status-badge'
import { ViolationStatusBadge } from '@/components/shared/violations/status-badge'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import { FramePanel } from '@/components/ui/frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { OwnerWithRelations } from '@/db/schema/zod/owners'
import { formatDate, getPaymentTypeLabel } from '@/lib/utils'

interface OwnerDetailsSheetProps {
  owner: OwnerWithRelations
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function OwnerDetailsSheet({ owner, state }: OwnerDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const pendingPayments = owner.payments.filter((p) => p.status === 'pending')
  const ownerFullName = `${owner.firstName} ${owner.lastName}`.trim()

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del propietario</SheetTitle>
          <SheetDescription>Información completa y detallada del propietario</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Personal info */}
          <CollapsibleDetails
            title="Información personal"
            icon={IconUser}
            content={
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Nombre</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{ownerFullName}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={owner.id} />
                </FramePanel>
                {owner.email && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Correo</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{owner.email}</p>
                  </FramePanel>
                )}
                {owner.phone && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Teléfono</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{owner.phone}</p>
                  </FramePanel>
                )}
              </div>
            }
          />

          {/* Houses info */}
          <CollapsibleDetails
            title="Casas"
            icon={IconHome}
            content={
              owner.houses.length > 0 ? (
                <div className="space-y-1">
                  {owner.houses.map((house) => {
                    const houseAddress = [house.street, house.city, house.state].filter(Boolean).join(', ')

                    return (
                      <FramePanel key={house.id} className="flex items-center gap-2 p-2">
                        <div className="min-w-0 flex-1">
                          <HouseNumberBadge number={house.houseNumber} />
                          {houseAddress && <p className="text-muted-foreground text-sm">{houseAddress}</p>}
                          {house.zipCode && (
                            <p className="text-muted-foreground text-sm">CP: {house.zipCode}</p>
                          )}
                        </div>
                        <CopyButton tooltipText="Copiar ID" value={house.id} />
                      </FramePanel>
                    )
                  })}
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Sin casas asignadas.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </FramePanel>
              )
            }
          />

          {/* Violations info */}
          <CollapsibleDetails
            title={
              <>
                Infracciones <Badge variant="outline">{owner.violations.length}</Badge>
              </>
            }
            icon={IconFlag}
            content={
              owner.violations.length > 0 ? (
                <div className="space-y-1">
                  {owner.violations.map((violation) => (
                    <FramePanel key={violation.id} className="flex items-center gap-2 p-2">
                      <div className="min-w-0 flex-1 leading-none">
                        <ViolationStatusBadge className="mb-1" status={violation.status} />
                        <h2 className="font-medium text-sm">{`$${Number(violation.amount).toFixed(2)}`}</h2>
                        <p className="text-muted-foreground text-sm">{violation.concept}</p>
                        <p className="text-muted-foreground text-xs">{formatDate(violation.violationDate)}</p>
                      </div>

                      <CopyButton tooltipText="Copiar ID" value={violation.id} />
                    </FramePanel>
                  ))}
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Sin infracciones pendientes.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </FramePanel>
              )
            }
          />

          {/* Peding payments */}
          <CollapsibleDetails
            title={
              <>
                Pagos pendientes <Badge variant="outline">{pendingPayments.length}</Badge>
              </>
            }
            icon={IconCurrencyDollar}
            content={
              pendingPayments.length > 0 ? (
                <div className="space-y-1">
                  {pendingPayments.map((payment) => (
                    <FramePanel key={payment.id} className="flex items-center gap-2 p-2">
                      <div className="min-w-0 flex-1">
                        <PaymentStatusBadge className="mb-1" status={payment.status} />
                        <h2 className="font-medium text-sm">{`$${Number(payment.amount).toFixed(2)}`}</h2>
                        <p className="text-muted-foreground text-xs">
                          {getPaymentTypeLabel(payment.paymentType)}
                        </p>
                      </div>

                      <CopyButton tooltipText="Copiar ID" value={payment.id} />
                    </FramePanel>
                  ))}
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Sin pagos pendientes.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </FramePanel>
              )
            }
          />
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de registro</span>
            <span>{formatDate(owner.createdAt)}</span>
          </div>
          {owner.updatedAt && new Date(owner.updatedAt).getTime() > new Date(owner.createdAt).getTime() && (
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Última actualización</span>
              <span>{formatDate(owner.updatedAt)}</span>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
