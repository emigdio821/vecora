import { IconAlertTriangle, IconCash, IconHome, IconMail, IconPhone, IconUser } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { OwnerWithRelations } from '@/db/schemas/zod'

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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Información del propietario</SheetTitle>
          <SheetDescription>Información completa y detallada del propietario</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {/* Personal Information */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger
              render={
                <Button variant="plain">
                  <span className="flex items-center gap-2">
                    <IconUser className="size-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground text-sm">Información personal</h3>
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium">{`${owner.firstName} ${owner.lastName}`}</p>
                    <p className="truncate font-mono text-muted-foreground text-xs">{owner.id}</p>
                  </div>
                  <CopyButton value={owner.id} />
                </div>

                {owner.email && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <IconMail className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Correo</p>
                      <p className="truncate text-sm">{owner.email}</p>
                    </div>
                  </div>
                )}

                {owner.phone && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <IconPhone className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Teléfono</p>
                      <p className="text-sm">{owner.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Houses */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger
              render={
                <Button variant="plain">
                  <span className="flex items-center gap-2">
                    <IconHome className="size-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground text-sm">Propiedades</h3>
                    <Badge variant="outline">{owner.houses.length}</Badge>
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              {owner.houses.length > 0 ? (
                <div className="space-y-2">
                  {owner.houses.map((house) => (
                    <div key={house.id} className="rounded-lg border p-3">
                      <div>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">Casa</span>
                          <Badge variant="outline">{house.houseNumber}</Badge>
                        </span>
                        {house.street && (
                          <p className="text-muted-foreground text-sm">
                            {house.street}
                            {house.city && `, ${house.city}`}
                            {house.state && `, ${house.state}`}
                          </p>
                        )}
                        {house.zipCode && (
                          <p className="text-muted-foreground text-xs">CP: {house.zipCode}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty className="border border-dashed p-3">
                  <EmptyHeader>
                    <EmptyDescription>No tiene propiedades asignadas.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Violations */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger
              render={
                <Button variant="plain">
                  <span className="flex items-center gap-2">
                    <IconAlertTriangle className="size-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground text-sm">Infracciones</h3>
                    <Badge variant="outline">{owner.violations.length}</Badge>
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              {owner.violations.length > 0 ? (
                <div className="space-y-2">
                  {owner.violations.map((violation) => (
                    <div key={violation.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{violation.concept}</p>
                          <p className="mt-1 text-muted-foreground text-xs">
                            Monto: ${Number(violation.amount).toFixed(2)}
                          </p>
                          {violation.violationDate && (
                            <p className="mt-1 text-muted-foreground text-xs">
                              {new Date(violation.violationDate).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <Badge variant={violation.status === 'paid' ? 'default' : 'destructive'}>
                          {violation.status === 'paid' ? 'Pagada' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty className="border border-dashed p-3">
                  <EmptyHeader>
                    <EmptyDescription>No tiene infracciones registradas.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Pending Payments */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger
              render={
                <Button variant="plain">
                  <span className="flex items-center gap-2">
                    <IconCash className="size-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground text-sm">Pagos pendientes</h3>
                    <Badge variant="outline">{pendingPayments.length}</Badge>
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              {pendingPayments.length > 0 ? (
                <div className="space-y-2">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {payment.paymentType === 'monthly_fee' ? 'Cuota mensual' : 'Infracción'}
                          </p>
                          <p className="mt-1 text-muted-foreground text-sm">
                            Monto: ${Number(payment.amount).toFixed(2)}
                          </p>
                          {payment.month && (
                            <p className="mt-1 text-muted-foreground text-xs">Mes: {payment.month}</p>
                          )}
                        </div>
                        <Badge variant="destructive">Pendiente</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty className="border border-dashed p-3">
                  <EmptyHeader>
                    <EmptyDescription>No tiene pagos pendientes.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
        <SheetFooter className="block border-t">
          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Fecha de registro</span>
              <span>
                {new Date(owner.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: '2-digit',
                })}
              </span>
            </div>
            {owner.updatedAt &&
              new Date(owner.updatedAt).getTime() !== new Date(owner.createdAt).getTime() && (
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Última actualización</span>
                  <span>
                    {new Date(owner.updatedAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                    })}
                  </span>
                </div>
              )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
