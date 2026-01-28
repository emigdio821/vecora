import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PaymentWithOwnerAndMonths } from '@/db/schemas/zod/payments'
import { PaymentDetailsSheet } from '../sheets/payment-details'

interface PaymentAmountCellProps {
  payment: PaymentWithOwnerAndMonths
}

export function PaymentAmountCell({ payment }: PaymentAmountCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        ${payment.amount}
      </Button>

      <PaymentDetailsSheet payment={payment} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </div>
  )
}
