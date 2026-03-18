import { useState } from 'react'
import type { PaymentQueryData } from '@/api/tanstack-queries/payments'
import { Button } from '@/components/ui/button'
import { PaymentDetailsSheet } from '../sheets/payment-details'

interface PaymentAmountCellProps {
  payment: PaymentQueryData
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

      <PaymentDetailsSheet payment={payment} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  )
}
