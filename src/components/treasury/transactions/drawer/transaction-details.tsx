'use client'

import { CalendarPlusIcon, HistoryIcon, NotebookPenIcon, ReceiptTextIcon, WalletIcon } from 'lucide-react'
import { CollapsibleSection, Detail, Timestamp } from '@/components/shared/details'
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
import { cn, formatCurrency, formatDay, formatMonth } from '@/lib/utils'
import type { TransactionQueryData } from '@/tanstack-queries/treasury'
import { KIND_LABEL, PAYMENT_METHOD_LABEL } from '../../kind'

interface TransactionDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  transaction: TransactionQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Read-only view; actions stay in the row menu. */
export function TransactionDetailsDrawer({
  transaction,
  open,
  onOpenChange,
  ...props
}: TransactionDetailsDrawerProps) {
  const { kind, property, fee_month, folio, reference, notes } = transaction
  const isIncome = kind === 'income'

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{transaction.description}</DrawerTitle>
          <DrawerDescription>Información del movimiento</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<ReceiptTextIcon />} title="Movimiento">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Tipo">{KIND_LABEL[kind]}</Detail>
              <Detail label="Monto">
                <span
                  className={cn(
                    'tabular-nums',
                    isIncome ? 'text-success-foreground' : 'text-destructive-foreground',
                  )}
                >
                  {isIncome ? '+' : '−'}
                  {formatCurrency(Number(transaction.amount))}
                </span>
              </Detail>
              <Detail label="Fecha">{formatDay(transaction.occurred_on)}</Detail>
              <Detail label="Periodo">{transaction.period.name}</Detail>
              <Detail label="Categoría">
                <Badge variant="outline">{transaction.category.name}</Badge>
              </Detail>
              {property && <Detail label="Casa">Casa {property.number}</Detail>}
              {fee_month && <Detail label="Mes de la cuota">{formatMonth(fee_month)}</Detail>}
              {folio && <Detail label="Folio">{folio}</Detail>}
            </div>
          </CollapsibleSection>

          <CollapsibleSection icon={<WalletIcon />} title="Pago">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="Método de pago">{PAYMENT_METHOD_LABEL[transaction.payment_method]}</Detail>
              {reference && <Detail label="Referencia">{reference}</Detail>}
            </div>
          </CollapsibleSection>

          {notes && (
            <CollapsibleSection icon={<NotebookPenIcon />} title="Notas">
              <p className="text-sm whitespace-pre-wrap">{notes}</p>
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp icon={<CalendarPlusIcon />} label="Creado" value={transaction.created_at} />
            <Timestamp icon={<HistoryIcon />} label="Actualizado" value={transaction.updated_at} />
          </dl>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>Cerrar</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
