import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TransactionQueryData } from '@/tanstack-queries/treasury'
import { TransactionDetailsDrawer } from '../drawer/transaction-details'

interface TransactionDescriptionCellProps {
  transaction: TransactionQueryData
}

export function TransactionDescriptionCell({ transaction }: TransactionDescriptionCellProps) {
  const [isDetailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <TransactionDetailsDrawer
        transaction={transaction}
        open={isDetailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <Button
        variant="ghost"
        className="max-w-full justify-start"
        onClick={() => {
          setDetailsOpen(true)
        }}
      >
        <span className="truncate">{transaction.description}</span>
      </Button>
    </>
  )
}
