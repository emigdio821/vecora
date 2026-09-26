'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { RequestDetailsDrawer } from '../drawer/request-details'

interface RequestTitleCellProps {
  request: MaintenanceRequestQueryData
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
