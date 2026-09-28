'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SecurityRequestQueryData } from '@/tanstack-queries/security'
import { RequestDetailsDrawer } from '../drawer/request-details'

interface RequestTitleCellProps {
  request: SecurityRequestQueryData
}

export function RequestTitleCell({ request }: RequestTitleCellProps) {
  const [isDetailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <RequestDetailsDrawer request={request} open={isDetailsOpen} onOpenChange={setDetailsOpen} />

      <Button
        variant="ghost"
        className="max-w-full justify-start"
        onClick={() => {
          setDetailsOpen(true)
        }}
      >
        <span className="truncate">{request.title}</span>
      </Button>
    </>
  )
}
