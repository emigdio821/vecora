import {
  IconCalendarPlus,
  IconCash,
  IconCircleCheck,
  IconCircleX,
  IconNotes,
  IconUrgent,
} from '@tabler/icons-react'
import { CollapsibleSection, Detail, Timestamp } from '@/components/shared/details'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '@/components/shared/request-status'
import { PAYMENT_METHOD_LABEL } from '@/components/treasury/kind'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { formatCurrency, formatDay } from '@/lib/utils'
import type { SecurityRequestQueryData } from '@/tanstack-queries/security'
import { KIND_LABEL } from '../kind'

interface RequestDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Read-only view; actions stay in the row menu. */
export function RequestDetailsDrawer({ request, open, onOpenChange, ...props }: RequestDetailsDrawerProps) {
  const { status, transaction, resolver } = request

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{request.title}</DrawerTitle>
          <DrawerDescription>Información de la solicitud</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<IconUrgent />} title="Solicitud">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Tipo">
                <Badge variant="outline">{KIND_LABEL[request.kind]}</Badge>
              </Detail>
              <Detail label="Estado">
                <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
              </Detail>
              <Detail label="Monto">
                <span className="tabular-nums">{formatCurrency(Number(request.amount))}</span>
              </Detail>
              <Detail label="Fecha">{formatDay(request.requested_on)}</Detail>
              <Detail label="Solicitó">{request.requester.full_name}</Detail>
            </div>
          </CollapsibleSection>

          {request.details && (
            <CollapsibleSection icon={<IconNotes />} title="Detalles">
              <p className="text-sm whitespace-pre-wrap">{request.details}</p>
            </CollapsibleSection>
          )}

          {status === 'paid' && transaction && (
            <CollapsibleSection icon={<IconCash />} title="Pago">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Fecha del pago">{formatDay(transaction.occurred_on)}</Detail>
                <Detail label="Método de pago">{PAYMENT_METHOD_LABEL[transaction.payment_method]}</Detail>
                {transaction.reference && <Detail label="Referencia">{transaction.reference}</Detail>}
                {resolver && <Detail label="Registró">{resolver.full_name}</Detail>}
              </div>
            </CollapsibleSection>
          )}

          {status === 'rejected' && (
            <CollapsibleSection icon={<IconCircleX />} title="Rechazo">
              <Detail label="Motivo">
                <p className="font-normal whitespace-pre-wrap">{request.rejection_reason}</p>
              </Detail>
              {resolver && <Detail label="Rechazó">{resolver.full_name}</Detail>}
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp icon={<IconCalendarPlus />} label="Enviada" value={request.created_at} />
            {request.resolved_at && (
              <Timestamp icon={<IconCircleCheck />} label="Resuelta" value={request.resolved_at} />
            )}
          </dl>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>Cerrar</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
