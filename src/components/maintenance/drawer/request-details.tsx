'use client'

import {
  BanknoteIcon,
  CalendarPlusIcon,
  CircleCheckIcon,
  CircleXIcon,
  NotebookPenIcon,
  WrenchIcon,
} from 'lucide-react'
import { CollapsibleSection, Detail, Timestamp } from '@/components/shared/details'
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
import type { MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '../status'

interface RequestDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  request: MaintenanceRequestQueryData
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
          <CollapsibleSection icon={<WrenchIcon />} title="Solicitud">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Monto">
                <span className="tabular-nums">{formatCurrency(Number(request.amount))}</span>
              </Detail>
              <Detail label="Fecha del trabajo">{formatDay(request.requested_on)}</Detail>
              <Detail label="Solicitó">{request.requester.full_name}</Detail>
              <Detail label="Estado">
                <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
              </Detail>
            </div>
          </CollapsibleSection>

          {request.details && (
            <CollapsibleSection icon={<NotebookPenIcon />} title="Detalles">
              <p className="text-sm whitespace-pre-wrap">{request.details}</p>
            </CollapsibleSection>
          )}

          {status === 'paid' && transaction && (
            <CollapsibleSection icon={<BanknoteIcon />} title="Pago">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Fecha del pago">{formatDay(transaction.occurred_on)}</Detail>
                <Detail label="Método de pago">{PAYMENT_METHOD_LABEL[transaction.payment_method]}</Detail>
                {transaction.reference && <Detail label="Referencia">{transaction.reference}</Detail>}
                {resolver && <Detail label="Registró">{resolver.full_name}</Detail>}
              </div>
            </CollapsibleSection>
          )}

          {status === 'rejected' && (
            <CollapsibleSection icon={<CircleXIcon />} title="Rechazo">
              <Detail label="Motivo">
                <p className="font-normal whitespace-pre-wrap">{request.rejection_reason}</p>
              </Detail>
              {resolver && <Detail label="Rechazó">{resolver.full_name}</Detail>}
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp icon={<CalendarPlusIcon />} label="Enviada" value={request.created_at} />
            {request.resolved_at && (
              <Timestamp icon={<CircleCheckIcon />} label="Resuelta" value={request.resolved_at} />
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
