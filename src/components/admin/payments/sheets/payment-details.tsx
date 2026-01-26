import { IconChevronDown, IconCurrencyDollar, IconUserHeart, IconWind } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import { Frame, FrameHeader, FramePanel } from '@/components/ui/frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { PaymentWithOwnerAndMonths } from '@/db/schemas/zod/payments'
import { cn, formatDate, getAllMonthsMap, getPaymentTypeLabel } from '@/lib/utils'

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
  const isPaid = payment.status === 'paid'
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
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información del pago
                </CollapsibleTrigger>
                <IconCurrencyDollar className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsiblePanel className="space-y-1">
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
                    <div className="inline-flex flex-wrap gap-1">
                      {payment.paymentMonths.map((month) => (
                        <Badge variant="outline" key={`${month.month}-${month.paymentId}`}>
                          <span>{MONTHS[month.month]}</span>
                        </Badge>
                      ))}
                    </div>
                  </FramePanel>
                )}
                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Estado</h2>

                  <Badge variant="outline">
                    <span
                      aria-hidden
                      className={cn('size-1.5 rounded-full', isPaid ? 'bg-success' : 'bg-warning')}
                    />
                    {isPaid ? 'Pagada' : 'Pendiente'}
                  </Badge>
                </FramePanel>
                {payment.paidAt && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Fecha de pago</h2>
                    <p className="text-muted-foreground text-sm">{formatDate(payment.paidAt)}</p>
                  </FramePanel>
                )}
              </CollapsiblePanel>
            </Collapsible>
          </Frame>

          {/* Owner info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Propietario
                </CollapsibleTrigger>
                <IconUserHeart className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsiblePanel>
                {payment.owner ? (
                  <div className="space-y-1">
                    <FramePanel className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-medium text-sm">Nombre</h2>
                          <p className="text-muted-foreground text-sm">{`${payment.owner.firstName} ${payment.owner.lastName}`}</p>
                        </div>
                        <CopyButton tooltipText="Copiar ID" value={payment.owner.id} />
                      </div>
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
                    <Empty className="p-0 md:p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-1">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>No tiene propietario asignado.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </FramePanel>
                )}
              </CollapsiblePanel>
            </Collapsible>
          </Frame>
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
