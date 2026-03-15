import { IconCurrencyDollar, IconUserHeart, IconWind } from '@tabler/icons-react'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { PaymentStatusBadge } from '@/components/shared/payments/status-badge'
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
import type { PaymentWithOwnerAndMonths } from '@/db/schema/zod/payments'
import { formatDate, getAllMonthsMap, getPaymentTypeLabel } from '@/lib/utils'

interface PaymentDetailsSheetProps {
  payment: PaymentWithOwnerAndMonths
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

const MONTHS = getAllMonthsMap()

export function PaymentDetailsSheet({ payment, state }: PaymentDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const showMonthlyFee = payment.paymentType === 'monthly_fee' && payment.paymentMonths.length > 0

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del pago</SheetTitle>
          <SheetDescription>Información completa y detallada del pago</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Payment info */}
          <CollapsibleDetails
            title="Información del pago"
            icon={IconCurrencyDollar}
            content={
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Monto</h2>
                    <p className="text-muted-foreground text-sm">${payment.amount}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={payment.id} />
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Tipo de pago</h2>
                  <p className="text-muted-foreground text-sm">{getPaymentTypeLabel(payment.paymentType)}</p>
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Concepto</h2>
                  <p className="text-muted-foreground text-sm">{payment.concept}</p>
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Año</h2>
                  <p className="text-muted-foreground text-sm">{payment.year}</p>
                </FramePanel>

                {showMonthlyFee && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Meses pagados</h2>
                    <div className="mt-1 inline-flex flex-wrap gap-1">
                      {payment.paymentMonths.length === 12 ? (
                        <Badge variant="outline">Todo el año</Badge>
                      ) : (
                        payment.paymentMonths.map((month) => (
                          <Badge variant="outline" key={`${month.month}-${month.paymentId}`}>
                            <span>{MONTHS[month.month]}</span>
                          </Badge>
                        ))
                      )}
                    </div>
                  </FramePanel>
                )}

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Estado</h2>
                  <PaymentStatusBadge className="mt-1" status={payment.status} />
                </FramePanel>

                {payment.paidAt && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Fecha de pago</h2>
                    <p className="text-muted-foreground text-sm">{formatDate(payment.paidAt)}</p>
                  </FramePanel>
                )}
              </div>
            }
          />

          {/* Owner info */}
          <CollapsibleDetails
            title="Propietario"
            icon={IconUserHeart}
            content={
              payment.owner ? (
                <div className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Nombre</h2>
                      <p className="text-muted-foreground text-sm">{`${payment.owner.firstName} ${payment.owner.lastName}`}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID" value={payment.owner.id} />
                  </FramePanel>

                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Correo</h2>
                    <p className="text-muted-foreground text-sm">{payment.owner.email}</p>
                  </FramePanel>

                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Teléfono</h2>
                    <p className="text-muted-foreground text-sm">{payment.owner.phone}</p>
                  </FramePanel>
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>No tiene propietario asignado.</EmptyDescription>
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
            <span>{formatDate(payment.createdAt)}</span>
          </div>

          {payment.updatedAt &&
            new Date(payment.updatedAt).getTime() > new Date(payment.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(payment.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
