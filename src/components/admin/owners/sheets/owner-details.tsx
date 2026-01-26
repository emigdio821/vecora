import {
  IconChevronDown,
  IconCurrencyDollar,
  IconFlag,
  IconHome,
  IconUser,
  IconWind,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { cn, formatDate } from '@/lib/utils'

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
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información personal
                </CollapsibleTrigger>
                <IconUser className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent className="space-y-1">
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
              </CollapsibleContent>
            </Collapsible>
          </Frame>

          {/* Houses info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Casas
                </CollapsibleTrigger>
                <IconHome className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent>
                {owner.houses.length > 0 ? (
                  <div className="space-y-1">
                    {owner.houses.map((house) => {
                      const houseAddress = [house.street, house.city, house.state].filter(Boolean).join(', ')

                      return (
                        <FramePanel key={house.id} className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <Badge size="lg" variant="outline">
                                {house.houseNumber}
                              </Badge>
                              {houseAddress && (
                                <p className="text-muted-foreground text-sm">{houseAddress}</p>
                              )}
                              {house.zipCode && (
                                <p className="text-muted-foreground text-sm">CP: {house.zipCode}</p>
                              )}
                            </div>
                            <CopyButton tooltipText="Copiar ID" value={house.id} />
                          </div>
                        </FramePanel>
                      )
                    })}
                  </div>
                ) : (
                  <FramePanel className="p-2">
                    <Empty className="p-0 md:p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-1">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>Sin casas asignadas.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </FramePanel>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Frame>

          {/* Violations info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Infracciones
                  <Badge variant="outline">{owner.violations.length}</Badge>
                </CollapsibleTrigger>
                <IconFlag className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent>
                {owner.violations.length > 0 ? (
                  <div className="space-y-1">
                    {owner.violations.map((violation) => {
                      const isViolationPaid = violation.status === 'paid'

                      return (
                        <FramePanel key={violation.id} className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1 leading-none">
                              <Badge variant="outline">
                                <span
                                  aria-hidden
                                  className={cn(
                                    'size-1.5 rounded-full',
                                    isViolationPaid ? 'bg-success' : 'bg-warning',
                                  )}
                                />
                                {isViolationPaid ? 'Pagada' : 'Pendiente'}
                              </Badge>
                              <h2 className="font-medium text-sm">{`$${Number(violation.amount).toFixed(2)}`}</h2>
                              <p className="text-muted-foreground text-sm">{violation.concept}</p>
                              <p className="text-muted-foreground text-xs">
                                {formatDate(violation.violationDate)}
                              </p>
                            </div>

                            <CopyButton tooltipText="Copiar ID" value={violation.id} />
                          </div>
                        </FramePanel>
                      )
                    })}
                  </div>
                ) : (
                  <FramePanel className="p-2">
                    <Empty className="p-0 md:p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-1">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>Sin infracciones pendientes.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </FramePanel>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Frame>

          {/* Peding payments */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Pagos pendientes
                  <Badge variant="outline">{pendingPayments.length}</Badge>
                </CollapsibleTrigger>
                <IconCurrencyDollar className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent>
                {pendingPayments.length > 0 ? (
                  <div className="space-y-1">
                    {pendingPayments.map((payment) => {
                      const isPaymentPaid = payment.status === 'paid'
                      const paymentLabel =
                        payment.paymentType === 'monthly_fee' ? 'Cuota mensual' : 'Infracción'

                      return (
                        <FramePanel key={payment.id} className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <Badge variant="outline">
                                <span
                                  aria-hidden
                                  className={cn(
                                    'size-1.5 rounded-full',
                                    isPaymentPaid ? 'bg-success' : 'bg-warning',
                                  )}
                                />
                                {isPaymentPaid ? 'Pagada' : 'Pendiente'}
                              </Badge>
                              <h2 className="font-medium text-sm">{`$${Number(payment.amount).toFixed(2)}`}</h2>
                              {/* TODO: Improve the month display */}
                              {/* <p className="text-muted-foreground text-sm">{payment.mon}</p> */}
                              <p className="text-muted-foreground text-xs">{paymentLabel}</p>
                            </div>

                            <CopyButton tooltipText="Copiar ID" value={payment.id} />
                          </div>
                        </FramePanel>
                      )
                    })}
                  </div>
                ) : (
                  <FramePanel className="p-2">
                    <Empty className="p-0 md:p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-1">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>Sin pagos pendientes.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </FramePanel>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Frame>
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
